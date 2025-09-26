from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus, DocumentType
from app.models.suggestion_run import (
    SuggestionEngine,
    SuggestionRun as SuggestionRunModel,
    SuggestionRunStatus,
)


def utc_now() -> datetime:
    """Tiny indirection to enable monkeypatching in tests."""
    return datetime.utcnow()


class SuggestionCollector:
    """Aggregates suggestion payloads while coalescing repeated reasons."""

    def __init__(self) -> None:
        self._data: Dict[Tuple[str, str | None, Tuple[str, ...]], Dict[str, Any]] = {}

    def add(
        self,
        *,
        item_type: str,
        account_ref: Optional[str],
        furnisher: Optional[str],
        bureaus: Iterable[str] | None,
        reason_code: str,
        evidence: Dict[str, Any],
    ) -> None:
        norm_bureaus = sorted({(b or "").upper() for b in (bureaus or []) if b})
        key = (item_type, account_ref or "", tuple(norm_bureaus))
        entry = self._data.get(key)
        if entry is None:
            entry = {
                "item_type": item_type,
                "account_ref": account_ref,
                "furnisher": furnisher,
                "bureaus": norm_bureaus,
                "reason_codes": [],
                "evidence": {},
            }
            self._data[key] = entry
        if furnisher and not entry.get("furnisher"):
            entry["furnisher"] = furnisher
        if norm_bureaus:
            entry["bureaus"] = sorted({*entry["bureaus"], *norm_bureaus})
        if reason_code not in entry["reason_codes"]:
            entry["reason_codes"].append(reason_code)
        entry["evidence"][reason_code] = evidence

    def as_list(self) -> List[Dict[str, Any]]:
        # Sort deterministically for stable tests / responses
        suggestions = list(self._data.values())
        suggestions.sort(key=lambda item: (
            item["item_type"], item.get("furnisher") or "", item.get("account_ref") or ""
        ))
        return suggestions


class DisputeSuggestionService:
    """Runs rule-based analyses on credit report snapshots."""

    NEGATIVE_STATUSES = {"collection", "chargeoff", "negative", "late", "delinquent"}
    POSITIVE_STATUSES = {"paid", "closed", "current", "positive"}

    def __init__(self, db: Session, tenant_id: UUID, client_id: UUID, *, as_of: Optional[datetime] = None) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.as_of = as_of or utc_now()
        self.collector = SuggestionCollector()

    # Public -----------------------------------------------------------------

    def generate(self) -> Tuple[List[Dict[str, Any]], SuggestionRunModel]:
        snapshot, source_document = self._load_latest_snapshot()
        suggestions: List[Dict[str, Any]]

        if not snapshot:
            run = self._persist_run([], result={"reason": "no_snapshot_found"})
            return [], run

        tradelines = snapshot.get("tradelines", [])
        collections = snapshot.get("collections", [])
        inquiries = snapshot.get("inquiries", [])

        self._analyze_tradelines(tradelines)
        self._analyze_collections(collections)
        self._analyze_inquiries(inquiries)
        self._detect_duplicate_account_numbers(tradelines)

        suggestions = self.collector.as_list()

        result_meta = {
            "generated_at": self.as_of.isoformat(),
            "source_document_id": str(source_document.id) if source_document else None,
            "counts": {
                "tradelines": len(tradelines),
                "collections": len(collections),
                "inquiries": len(inquiries),
                "suggestions": len(suggestions),
            },
        }
        run = self._persist_run(suggestions, result_meta)
        return suggestions, run

    # Snapshot handling -------------------------------------------------------

    def _load_latest_snapshot(self) -> Tuple[Optional[Dict[str, Any]], Optional[Document]]:
        document = (
            self.db.query(Document)
            .filter(
                Document.tenant_id == self.tenant_id,
                Document.client_id == self.client_id,
                Document.document_type == DocumentType.CREDIT_REPORT,
                Document.status == DocumentStatus.PROCESSED,
            )
            .order_by(Document.created_at.desc())
            .first()
        )
        if not document:
            return None, None
        metadata = document.processing_metadata
        if not isinstance(metadata, dict):
            metadata = {}
        snapshot = metadata.get("normalized_snapshot") or metadata.get("snapshot")
        if not snapshot:
            return None, document
        return snapshot, document

    # Persistence -------------------------------------------------------------

    def _persist_run(self, suggestions: List[Dict[str, Any]], result: Dict[str, Any]) -> SuggestionRunModel:
        run = SuggestionRunModel(
            tenant_id=self.tenant_id,
            client_id=self.client_id,
            case_id=None,
            item_id=None,
            letter_id=None,
            engine=SuggestionEngine.RULES,
            status=SuggestionRunStatus.COMPLETED,
            prompt=None,
            result=result,
            suggestions=suggestions,
            score=None,
            started_at=self.as_of,
            completed_at=self.as_of,
        )
        run.created_at = self.as_of
        run.updated_at = self.as_of
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    # Analysers ---------------------------------------------------------------

    def _analyze_tradelines(self, tradelines: Iterable[Dict[str, Any]]) -> None:
        for tradeline in tradelines:
            bureaus_payload = tradeline.get("bureaus") or {}
            if not isinstance(bureaus_payload, dict):
                bureaus_payload = {}
            bureaus: Dict[str, Dict[str, Any]] = {
                (bureau or "").lower(): (data or {}) if isinstance(data, dict) else {}
                for bureau, data in bureaus_payload.items()
            }
            account_ref = tradeline.get("account_ref") or tradeline.get("account_number")
            furnisher = tradeline.get("furnisher")

            # Late payment anomalies and inconsistent statuses
            self._detect_late_payment_anomalies(tradeline, bureaus, account_ref, furnisher)
            self._detect_balance_limit_inconsistencies(tradeline, bureaus, account_ref, furnisher)
            self._detect_status_conflicts(tradeline, bureaus, account_ref, furnisher)
            self._detect_obsolete_dofd(tradeline, bureaus, account_ref, furnisher)

    def _analyze_collections(self, collections: Iterable[Dict[str, Any]]) -> None:
        for entry in collections:
            bureaus_payload = entry.get("bureaus") or {}
            if not isinstance(bureaus_payload, dict):
                bureaus_payload = {}
            bureaus: Dict[str, Dict[str, Any]] = {
                (bureau or "").lower(): (data or {}) if isinstance(data, dict) else {}
                for bureau, data in bureaus_payload.items()
            }
            account_ref = entry.get("account_ref")
            furnisher = entry.get("furnisher")
            self._detect_obsolete_dofd(entry, bureaus, account_ref, furnisher, item_type="collection")

    def _analyze_inquiries(self, inquiries: Iterable[Dict[str, Any]]) -> None:
        two_years = timedelta(days=730)
        for inquiry in inquiries:
            if (inquiry.get("type") or "").lower() != "hard":
                continue
            date = self._parse_date(inquiry.get("date"))
            if not date:
                continue
            age = self.as_of.date() - date
            if age > two_years:
                account_ref = inquiry.get("reference") or f"INQ-{inquiry.get('bureau','')}-{inquiry.get('furnisher','')}"
                bureaus = [inquiry.get("bureau", "").lower()] if inquiry.get("bureau") else []
                evidence = {
                    "inquiry_date": date.isoformat(),
                    "age_days": age.days,
                    "furnisher": inquiry.get("furnisher"),
                }
                self.collector.add(
                    item_type="inquiry",
                    account_ref=account_ref,
                    furnisher=inquiry.get("furnisher"),
                    bureaus=bureaus,
                    reason_code="obsolete_inquiry",
                    evidence=evidence,
                )

    def _detect_duplicate_account_numbers(self, tradelines: Iterable[Dict[str, Any]]) -> None:
        account_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for tradeline in tradelines:
            number = tradeline.get("account_number")
            if not number:
                continue
            account_map[number].append(tradeline)
        for number, entries in account_map.items():
            furnishers = {entry.get("furnisher") for entry in entries if entry.get("furnisher")}
            if len(furnishers) > 1:
                bureaus = set()
                for entry in entries:
                    entry_bureaus = entry.get("bureaus") or {}
                    if isinstance(entry_bureaus, dict):
                        bureaus.update(entry_bureaus.keys())
                evidence = {
                    "account_number": number,
                    "furnishers": sorted(f for f in furnishers if f),
                    "count": len(entries),
                }
                self.collector.add(
                    item_type="tradeline",
                    account_ref=number,
                    furnisher="Multiple",
                    bureaus=[b.lower() for b in bureaus if b],
                    reason_code="duplicate_account_number",
                    evidence=evidence,
                )

    # Rule helpers ------------------------------------------------------------

    def _detect_late_payment_anomalies(
        self,
        tradeline: Dict[str, Any],
        bureaus: Dict[str, Dict[str, Any]],
        account_ref: Optional[str],
        furnisher: Optional[str],
    ) -> None:
        anomalies: Dict[str, Any] = {}
        status_set = set()
        for bureau, data in bureaus.items():
            status = (data.get("status") or "").lower()
            if status:
                status_set.add(status)
            late_counts = 0
            counts_payload = data.get("late_counts")
            if isinstance(counts_payload, dict):
                late_counts = sum(int(v) for v in counts_payload.values())
            elif isinstance(counts_payload, list):
                late_counts = len(counts_payload)
            elif isinstance(counts_payload, (int, float)):
                late_counts = int(counts_payload)
            history = data.get("late_history") or []
            if late_counts or history:
                anomalies[bureau] = {
                    "late_counts": late_counts,
                    "late_history": history,
                }
        if anomalies:
            evidence = {"bureaus": anomalies}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureaus.keys(),
                reason_code="late_payment_anomaly",
                evidence=evidence,
            )
        if len(status_set) > 1:
            evidence = {"statuses": {bureau: bureaus[bureau].get("status") for bureau in bureaus}}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureaus.keys(),
                reason_code="status_conflict",
                evidence=evidence,
            )

    def _detect_balance_limit_inconsistencies(
        self,
        tradeline: Dict[str, Any],
        bureaus: Dict[str, Dict[str, Any]],
        account_ref: Optional[str],
        furnisher: Optional[str],
    ) -> None:
        bureau_metrics = []
        for bureau, data in bureaus.items():
            balance = data.get("balance")
            credit_limit = data.get("credit_limit")
            if balance is None or credit_limit in (None, 0):
                continue
            try:
                balance_val = float(balance)
                limit_val = float(credit_limit)
            except (TypeError, ValueError):
                continue
            bureau_metrics.append((bureau, balance_val, limit_val))
        if len(bureau_metrics) < 2:
            return
        inconsistencies = []
        for i in range(len(bureau_metrics)):
            for j in range(i + 1, len(bureau_metrics)):
                b1, bal1, limit1 = bureau_metrics[i]
                b2, bal2, limit2 = bureau_metrics[j]
                reference_limit = max(limit1, limit2, 1.0)
                if abs(bal1 - bal2) / reference_limit > 0.10:
                    inconsistencies.append({
                        "bureaus": [b1, b2],
                        "balances": {b1: bal1, b2: bal2},
                        "limits": {b1: limit1, b2: limit2},
                        "difference": abs(bal1 - bal2),
                    })
        if inconsistencies:
            evidence = {"pairs": inconsistencies}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureaus.keys(),
                reason_code="balance_limit_inconsistency",
                evidence=evidence,
            )

    def _detect_status_conflicts(
        self,
        tradeline: Dict[str, Any],
        bureaus: Dict[str, Dict[str, Any]],
        account_ref: Optional[str],
        furnisher: Optional[str],
    ) -> None:
        overall_status = (tradeline.get("overall_status") or "").lower()
        bureau_statuses = {(bureau or "").lower(): (data.get("status") or "").lower() for bureau, data in bureaus.items()}
        if not bureau_statuses:
            return
        positives = {k for k, v in bureau_statuses.items() if v in self.POSITIVE_STATUSES}
        negatives = {k for k, v in bureau_statuses.items() if v in self.NEGATIVE_STATUSES}
        if positives and negatives:
            evidence = {"statuses": bureau_statuses}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureaus.keys(),
                reason_code="status_conflict",
                evidence=evidence,
            )
            return
        if overall_status in self.POSITIVE_STATUSES and negatives:
            evidence = {"overall_status": overall_status, "bureau_statuses": bureau_statuses}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureau_statuses.keys(),
                reason_code="status_conflict",
                evidence=evidence,
            )
        elif overall_status in self.NEGATIVE_STATUSES and positives:
            evidence = {"overall_status": overall_status, "bureau_statuses": bureau_statuses}
            self.collector.add(
                item_type="tradeline",
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=bureau_statuses.keys(),
                reason_code="status_conflict",
                evidence=evidence,
            )

    def _detect_obsolete_dofd(
        self,
        record: Dict[str, Any],
        bureaus: Dict[str, Dict[str, Any]],
        account_ref: Optional[str],
        furnisher: Optional[str],
        *,
        item_type: str = "tradeline",
    ) -> None:
        threshold = timedelta(days=365 * 7)
        obsolete_flags = {}
        for bureau, data in bureaus.items():
            status = (data.get("status") or "").lower()
            if status and status not in self.NEGATIVE_STATUSES:
                continue
            dofd = self._parse_date(data.get("dofd") or data.get("date_of_first_delinquency"))
            if not dofd:
                continue
            age = self.as_of.date() - dofd
            if age > threshold:
                obsolete_flags[bureau] = {
                    "dofd": dofd.isoformat(),
                    "age_days": age.days,
                    "status": data.get("status"),
                }
        if obsolete_flags:
            self.collector.add(
                item_type=item_type,
                account_ref=account_ref,
                furnisher=furnisher,
                bureaus=obsolete_flags.keys(),
                reason_code="obsolete_dofd",
                evidence={"bureaus": obsolete_flags},
            )

    # Utilities ---------------------------------------------------------------

    @staticmethod
    def _parse_date(value: Any) -> Optional[datetime.date]:
        if not value:
            return None
        try:
            if isinstance(value, datetime):
                return value.date()
            if isinstance(value, str):
                return datetime.fromisoformat(value.replace("Z", "")).date()
        except ValueError:
            return None
        return None


def generate_dispute_suggestions(
    db: Session,
    *,
    tenant_id: UUID,
    client_id: UUID,
    as_of: Optional[datetime] = None,
) -> Tuple[List[Dict[str, Any]], SuggestionRunModel]:
    service = DisputeSuggestionService(db, tenant_id, client_id, as_of=as_of)
    return service.generate()

