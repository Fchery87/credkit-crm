# Credit Report Snapshot Schema

The dispute suggestion engine consumes normalized credit-report snapshots embedded in `Document.processing_metadata["normalized_snapshot"]`. This guide documents the required structure and field semantics so upstream ingestion jobs can feed compatible payloads.

## Envelope

```
{
  "generated_at": "2025-09-17T00:00:00Z",
  "tradelines": [...],
  "collections": [...],
  "inquiries": [...]
}
```

- `generated_at` (string, ISO-8601): Timestamp the report was produced.
- `tradelines` (array<object>): Revolving/installment account data.
- `collections` (array<object>): Collection account data.
- `inquiries` (array<object>): Hard inquiry records (soft inquiries are ignored).

## Tradeline Object

```
{
  "account_ref": "ACC-001",
  "account_number": "1234567890",
  "furnisher": "Capital One",
  "overall_status": "open",
  "bureaus": {
    "EXPERIAN": {
      "status": "late",
      "balance": 1200,
      "credit_limit": 1000,
      "late_counts": {"30": 2, "60": 1},
      "late_history": ["2024-01", "2024-02"],
      "dofd": "2019-03-01"
    },
    "EQUIFAX": {
      "status": "current",
      "balance": 900,
      "credit_limit": 1000,
      "late_counts": {},
      "late_history": [],
      "dofd": "2019-03-01"
    }
  }
}
```

Field guidance:
- `account_ref` (string): Stable identifier from the credit bureau. Optional but recommended.
- `account_number` (string): Raw account number; required for duplicate detection.
- `furnisher` (string): Creditor name used in downstream letters.
- `overall_status` (string, optional): High-level status; compared against bureau statuses to detect conflicts.
- `bureaus` (object): Keys must be bureau names (`EXPERIAN`, `EQUIFAX`, `TRANSUNION`, `INNOVIS`). Values must be objects (not arrays/strings).
  - `status` (string): Bureau-specific status (e.g., `current`, `late`, `chargeoff`).
  - `balance` (number): Current balance reported to that bureau.
  - `credit_limit` (number): Reported credit limit (used for balance/limit discrepancies).
  - `late_counts` (object|array|number): Total late payments; coerced to counts during analysis.
  - `late_history` (array<string>): Timeline of late payment codes.
  - `dofd` / `date_of_first_delinquency` (string ISO date): Used to detect obsolete accounts (>7 years old).

## Collection Object

Same structure as tradeline but typically without credit limit:

```
{
  "account_ref": "COLL-001",
  "furnisher": "ABC Collections",
  "bureaus": {
    "EXPERIAN": {
      "status": "collection",
      "dofd": "2014-01-01"
    }
  }
}
```

- Bureau entries must remain dictionaries; malformed types are ignored by the service.
- DOFD older than 7 years triggers `obsolete_dofd` suggestions when the status is negative.

## Inquiry Object

```
{
  "bureau": "EXPERIAN",
  "furnisher": "Auto Loans LLC",
  "type": "hard",
  "date": "2020-02-01",
  "reference": "EX-12345"
}
```

- `type`: Only `hard` inquiries older than 2 years generate `obsolete_inquiry` suggestions.
- `date`: ISO date string required for age calculation.
- `bureau`: Optional but recommended; normalized to lowercase inside the service.

## Required Behaviors

1. **Processed Documents Only** — The engine only reads snapshots from documents where `status == processed`.
2. **Malformed Data Handling** — Non-dict `bureaus` payloads are ignored; ensure ingestion emits objects per bureau.
3. **Empty Snapshot** — Absence of snapshot data must still persist a completed run with `result.reason = "no_snapshot_found"` and zero suggestions.

## Validation Checklist

- [ ] Each bureau map is a JSON object keyed by bureau code.
- [ ] Numeric fields (`balance`, `credit_limit`) are numbers or numeric strings.
- [ ] DOFD dates use ISO `YYYY-MM-DD`.
- [ ] Hard inquiries older than 730 days retain `bureau`, `furnisher`, and `date`.
- [ ] Document processing status is `processed` before the snapshot is ingested.

Refer to `backend/tests/test_dispute_suggestions.py` for concrete snapshots used by the automated test suite.
