import uuid
from datetime import datetime, timedelta

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker

from app import crud, models
from app.database import Base, get_db
from app.main import app
from app.models.document import Document, DocumentStatus, DocumentType
from app.schemas.user import UserCreate
from app.security import create_access_token


# --- SQLAlchemy type shims so SQLite accepts Postgres-only types ---------------

@compiles(JSONB, "sqlite")
def _compile_jsonb(_element, _compiler, **_kw):
    return "JSON"


@compiles(ARRAY, "sqlite")
def _compile_array(_element, _compiler, **_kw):
    return "TEXT"


@compiles(PG_UUID, "sqlite")
def _compile_uuid(_element, _compiler, **_kw):
    return "CHAR(36)"


# --- Local SQLite test database ----------------------------------------------

TEST_DB_URL = "sqlite:///./test_dispute_suggestions.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Ensure server defaults like '::jsonb' are stripped so SQLite can create tables

def _normalize_defaults(metadata):
    for table in metadata.tables.values():
        for column in table.columns:
            default = column.server_default
            if default is None:
                continue
            if hasattr(default, 'arg'):
                raw = str(default.arg)
            else:
                raw = str(default)
            if not raw:
                column.server_default = None
                continue
            if '::' in raw:
                raw = raw.split('::', 1)[0]
            if raw.startswith("(") and raw.endswith(")"):
                raw = raw[1:-1]
            cleaned = raw.strip()
            column.server_default = cleaned if cleaned else None



@pytest.fixture(scope="module")
def client():
    engine.dispose()
    db_file = Path("test_dispute_suggestions.db")
    if db_file.exists():
        db_file.unlink()
    _normalize_defaults(Base.metadata)
    Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def seeded_user():
    db = TestingSessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "suggestions@example.com").first()
        if existing:
            user = existing
        else:
            user = crud.create_user(
                db,
                UserCreate(
                    email="suggestions@example.com",
                    password="StrongPass!123",
                    first_name="Suggest",
                    last_name="Agent",
                    organization_name="Suggestion Org",
                ),
            )
        token = create_access_token({"sub": user.email, "tenant_id": str(user.tenant_id)})
        return {
            "user_id": user.id,
            "tenant_id": user.tenant_id,
            "headers": {"Authorization": f"Bearer {token}"},
        }
    finally:
        db.close()

# --- Helpers -----------------------------------------------------------------

def _persist_snapshot(
    db,
    tenant_id,
    client_id,
    uploaded_by,
    snapshot,
    *,
    created_at: datetime | None = None,
):
    document = Document(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        client_id=client_id,
        filename="snapshot.json",
        original_filename="snapshot.json",
        document_type=DocumentType.CREDIT_REPORT,
        status=DocumentStatus.PROCESSED,
        s3_key=f"snapshots/{uuid.uuid4()}.json",
        uploaded_by=uploaded_by,
        processing_metadata={"normalized_snapshot": snapshot},
    )
    if created_at is not None:
        document.created_at = created_at
    db.add(document)
    db.commit()


def _create_client(db, tenant_id, *, first_name="John", suffix="Doe") -> uuid.UUID:
    client_id = uuid.uuid4()
    client = models.Client(
        id=client_id,
        tenant_id=tenant_id,
        first_name=first_name,
        last_name=suffix,
        email=f"{first_name.lower()}.{suffix.lower()}@example.com",
        phone="+1-555-0000",
    )
    db.add(client)
    db.commit()
    return client_id


def _dirty_snapshot(as_of: datetime) -> dict:
    return {
        "generated_at": as_of.isoformat(),
        "tradelines": [
            {
                "account_ref": "ACC-001",
                "account_number": "1234",
                "furnisher": "Capital One",
                "overall_status": "open",
                "bureaus": {
                    "EXPERIAN": {
                        "status": "late",
                        "balance": 1200,
                        "credit_limit": 1000,
                        "late_counts": {"30": 2},
                        "dofd": "2015-03-01",
                    },
                    "EQUIFAX": {
                        "status": "current",
                        "balance": 900,
                        "credit_limit": 1000,
                        "late_counts": {},
                        "dofd": "2015-03-01",
                    },
                },
            },
            {
                "account_ref": "ACC-002",
                "account_number": "5678",
                "furnisher": "Chase",
                "overall_status": "paid",
                "bureaus": {
                    "EXPERIAN": {
                        "status": "open",
                        "balance": 0,
                        "credit_limit": 5000,
                    }
                },
            },
            {
                "account_ref": "ACC-003",
                "account_number": "DUPE-1",
                "furnisher": "Bank A",
                "overall_status": "open",
                "bureaus": {
                    "EXPERIAN": {
                        "status": "open",
                        "balance": 300,
                        "credit_limit": 1500,
                    }
                },
            },
            {
                "account_ref": "ACC-004",
                "account_number": "DUPE-1",
                "furnisher": "Bank B",
                "overall_status": "open",
                "bureaus": {
                    "EQUIFAX": {
                        "status": "open",
                        "balance": 200,
                        "credit_limit": 1500,
                    }
                },
            },
        ],
        "collections": [
            {
                "account_ref": "COLL-1",
                "furnisher": "ABC Collections",
                "bureaus": {
                    "EXPERIAN": {
                        "status": "collection",
                        "dofd": "2014-01-01",
                    }
                },
            }
        ],
        "inquiries": [
            {
                "bureau": "EXPERIAN",
                "furnisher": "Auto Loans LLC",
                "type": "hard",
                "date": "2020-02-01",
            },
            {
                "bureau": "EXPERIAN",
                "furnisher": "Recent Hard",
                "type": "hard",
                "date": as_of.date().isoformat(),
            },
        ],
    }


def _clean_snapshot(as_of: datetime) -> dict:
    return {
        "generated_at": as_of.isoformat(),
        "tradelines": [
            {
                "account_ref": "ACC-CLEAN",
                "account_number": "CLEAN-1",
                "furnisher": "Bank Clean",
                "overall_status": "current",
                "bureaus": {
                    "EXPERIAN": {
                        "status": "current",
                        "balance": 500,
                        "credit_limit": 1500,
                    }
                },
            }
        ],
        "collections": [],
        "inquiries": [
            {
                "bureau": "EXPERIAN",
                "furnisher": "Mortgage LLC",
                "type": "hard",
                "date": (as_of - timedelta(days=100)).date().isoformat(),
            }
        ],
    }


# --- Tests -------------------------------------------------------------------


def test_no_snapshot_returns_reason(client, seeded_user):
    db = TestingSessionLocal()
    try:
        missing_client_id = _create_client(
            db,
            seeded_user["tenant_id"],
            first_name="Snapshot",
            suffix="Missing",
        )

        response = client.get(
            "/api/disputes/suggestions",
            params={"client_id": str(missing_client_id)},
            headers=seeded_user["headers"],
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["suggestions"] == []

        run = (
            db.query(models.SuggestionRun)
            .filter(models.SuggestionRun.client_id == missing_client_id)
            .order_by(models.SuggestionRun.created_at.desc())
            .first()
        )
        assert run is not None
        assert run.result.get("reason") == "no_snapshot_found"
    finally:
        db.close()


def test_processing_snapshot_is_ignored(client, seeded_user):
    as_of = datetime(2025, 9, 17)
    db = TestingSessionLocal()
    try:
        client_id = _create_client(
            db,
            seeded_user["tenant_id"],
            first_name="Processing",
            suffix="Client",
        )
        document = Document(
            id=uuid.uuid4(),
            tenant_id=seeded_user["tenant_id"],
            client_id=client_id,
            filename="processing.json",
            original_filename="processing.json",
            document_type=DocumentType.CREDIT_REPORT,
            status=DocumentStatus.PROCESSING,
            s3_key=f"snapshots/{uuid.uuid4()}.json",
            uploaded_by=seeded_user["user_id"],
            processing_metadata={"normalized_snapshot": _dirty_snapshot(as_of)},
        )
        db.add(document)
        db.commit()

        response = client.get(
            "/api/disputes/suggestions",
            params={"client_id": str(client_id)},
            headers=seeded_user["headers"],
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["suggestions"] == []

        run = (
            db.query(models.SuggestionRun)
            .filter(models.SuggestionRun.client_id == client_id)
            .order_by(models.SuggestionRun.created_at.desc())
            .first()
        )
        assert run is not None
        assert run.result.get("reason") == "no_snapshot_found"
    finally:
        db.close()


def test_malformed_bureau_data_is_ignored(client, seeded_user):
    as_of = datetime(2025, 9, 17)
    db = TestingSessionLocal()
    try:
        malformed_client_id = _create_client(
            db,
            seeded_user["tenant_id"],
            first_name="Malformed",
            suffix="Bureau",
        )
        bad_snapshot = {
            "generated_at": as_of.isoformat(),
            "tradelines": [
                {
                    "account_ref": "ACC-BAD",
                    "account_number": "BAD-1",
                    "furnisher": "Unknown Bank",
                    "bureaus": ["this is wrong"],
                }
            ],
            "collections": [],
            "inquiries": [],
        }
        _persist_snapshot(
            db,
            tenant_id=seeded_user["tenant_id"],
            client_id=malformed_client_id,
            uploaded_by=seeded_user["user_id"],
            snapshot=bad_snapshot,
            created_at=as_of,
        )

        response = client.get(
            "/api/disputes/suggestions",
            params={"client_id": str(malformed_client_id)},
            headers=seeded_user["headers"],
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["suggestions"] == []

        run = (
            db.query(models.SuggestionRun)
            .filter(models.SuggestionRun.client_id == malformed_client_id)
            .order_by(models.SuggestionRun.created_at.desc())
            .first()
        )
        assert run is not None
        assert run.suggestions == []
        assert run.result["counts"]["suggestions"] == 0
    finally:
        db.close()


def test_dirty_snapshot_returns_suggestions(client, seeded_user):
    as_of = datetime(2025, 9, 17)
    db = TestingSessionLocal()
    try:
        db.query(models.SuggestionRun).delete()
        db.commit()

        dirty_client_id = _create_client(
            db,
            seeded_user["tenant_id"],
            first_name="Dirty",
            suffix="Client",
        )
        _persist_snapshot(
            db,
            tenant_id=seeded_user["tenant_id"],
            client_id=dirty_client_id,
            uploaded_by=seeded_user["user_id"],
            snapshot=_dirty_snapshot(as_of),
            created_at=as_of,
        )

        response = client.get(
            "/api/disputes/suggestions",
            params={"client_id": str(dirty_client_id)},
            headers=seeded_user["headers"],
        )
        assert response.status_code == 200

        payload = response.json()
        assert payload["run_id"]
        assert len(payload["suggestions"]) >= 4

        reason_bag = {reason for item in payload["suggestions"] for reason in item["reason_codes"]}
        expected_reasons = {
            "late_payment_anomaly",
            "balance_limit_inconsistency",
            "status_conflict",
            "obsolete_dofd",
            "duplicate_account_number",
            "obsolete_inquiry",
        }
        assert expected_reasons.issubset(reason_bag)

        run = (
            db.query(models.SuggestionRun)
            .filter(models.SuggestionRun.client_id == dirty_client_id)
            .order_by(models.SuggestionRun.created_at.desc())
            .first()
        )
        assert run is not None
        assert run.engine.value == "rules"
        assert run.status.value == "completed"
        assert run.suggestions
    finally:
        db.close()


def test_clean_snapshot_returns_empty_suggestions(client, seeded_user):
    as_of = datetime(2025, 9, 17)
    db = TestingSessionLocal()
    try:
        clean_client_id = _create_client(
            db,
            seeded_user["tenant_id"],
            first_name="Clean",
            suffix="Client",
        )
        _persist_snapshot(
            db,
            tenant_id=seeded_user["tenant_id"],
            client_id=clean_client_id,
            uploaded_by=seeded_user["user_id"],
            snapshot=_clean_snapshot(as_of),
            created_at=as_of,
        )

        response = client.get(
            "/api/disputes/suggestions",
            params={"client_id": str(clean_client_id)},
            headers=seeded_user["headers"],
        )
        assert response.status_code == 200

        payload = response.json()
        assert payload["suggestions"] == []
        assert payload["run_id"]

        run = (
            db.query(models.SuggestionRun)
            .filter(models.SuggestionRun.client_id == clean_client_id)
            .order_by(models.SuggestionRun.created_at.desc())
            .first()
        )
        assert run is not None
        assert run.suggestions == []
    finally:
        db.close()


def test_client_not_found_returns_404(client, seeded_user):
    response = client.get(
        "/api/disputes/suggestions",
        params={"client_id": str(uuid.uuid4())},
        headers=seeded_user["headers"],
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Client not found"

