import re
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.schemas.user import UserCreate
from app import crud, models
from app.security import create_access_token


@compiles(JSONB, "sqlite")
def _compile_jsonb(element, compiler, **kw):
    return "JSON"


@compiles(ARRAY, "sqlite")
def _compile_array(element, compiler, **kw):
    return "TEXT"


@compiles(PG_UUID, "sqlite")
def _compile_uuid(element, compiler, **kw):
    return "CHAR(36)"


def _normalize_postgres_defaults():
    pattern = re.compile(r"::[a-zA-Z0-9_]+")
    for table in Base.metadata.tables.values():
        for column in table.columns:
            default = column.server_default
            if default is not None and hasattr(default, "arg"):
                default_text = str(default.arg)
                if "::" in default_text:
                    column.server_default = None


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dispute_domain.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    _normalize_postgres_defaults()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    assert "users" in insp.get_table_names()
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def seed_user(client: TestClient):
    db = TestingSessionLocal()
    try:
        user = crud.create_user(
            db,
            UserCreate(
                email="caseowner@example.com",
                password="StrongPass!123",
                first_name="Case",
                last_name="Owner",
                organization_name="Test Org",
            ),
        )
        return {"id": user.id, "tenant_id": user.tenant_id, "email": user.email}
    finally:
        db.close()


@pytest.fixture
def auth_headers(seed_user):
    token = create_access_token({"sub": seed_user["email"], "tenant_id": str(seed_user["tenant_id"])})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def created_client(seed_user):
    db = TestingSessionLocal()
    try:
        client_obj = models.Client(
            id=uuid.uuid4(),
            tenant_id=seed_user["tenant_id"],
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone="+1-555-0001",
        )
        db.add(client_obj)
        db.commit()
        db.refresh(client_obj)
        return {"id": str(client_obj.id)}
    finally:
        db.close()


def test_dispute_case_lifecycle(client: TestClient, auth_headers, created_client):
    case_payload = {
        "title": "Credit Report Cleanup",
        "description": "Dispute inaccuracies on the credit report",
        "client_id": created_client["id"],
        "case_number": "CASE-1001",
        "priority": "high",
    }

    case_response = client.post(
        "/api/v1/dispute-cases/", json=case_payload, headers=auth_headers
    )
    assert case_response.status_code == 201
    dispute_case = case_response.json()
    assert dispute_case["case_number"] == case_payload["case_number"]

    case_id = dispute_case["id"]

    item_payload = {
        "label": "Erroneous Late Payment",
        "bureau": "experian",
        "item_type": "account",
        "position": 1,
        "details": {"reported_date": "2024-01-01"},
    }

    item_response = client.post(
        f"/api/v1/dispute-cases/{case_id}/items/",
        json=item_payload,
        headers=auth_headers,
    )
    assert item_response.status_code == 201
    dispute_item = item_response.json()
    assert dispute_item["label"] == item_payload["label"]

    template_payload = {
        "name": "Initial Dispute Letter",
        "slug": "initial-dispute-letter",
        "body": "Hello {{client_name}}, this is a dispute letter.",
        "subject": "Dispute Notification",
        "variables": [{"key": "client_name", "label": "Client Name"}],
    }

    template_response = client.post(
        "/api/v1/letter-templates/", json=template_payload, headers=auth_headers
    )
    assert template_response.status_code == 201
    template = template_response.json()

    letter_payload = {
        "item_id": dispute_item["id"],
        "template_id": template["id"],
        "render_context": {"client_name": "John Doe"},
    }

    letter_response = client.post(
        f"/api/v1/dispute-cases/{case_id}/letters/",
        json=letter_payload,
        headers=auth_headers,
    )
    assert letter_response.status_code == 201
    letter = letter_response.json()
    assert letter["subject"] == template_payload["subject"]
    assert letter["body"] == template_payload["body"]

    run_payload = {
        "case_id": case_id,
        "item_id": dispute_item["id"],
        "letter_id": letter["id"],
        "engine": "gpt",
        "status": "running",
        "prompt": "Summarize dispute context",
        "suggestions": [{"text": "Highlight incorrect payment date."}],
    }

    run_response = client.post(
        "/api/v1/suggestion-runs/", json=run_payload, headers=auth_headers
    )
    assert run_response.status_code == 201
    suggestion_run = run_response.json()
    assert suggestion_run["status"] == "running"
    assert suggestion_run["started_at"] is not None

    update_run = {"status": "completed", "result": {"summary": "Completed"}}
    update_response = client.put(
        f"/api/v1/suggestion-runs/{suggestion_run['id']}",
        json=update_run,
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    completed_run = update_response.json()
    assert completed_run["status"] == "completed"
    assert completed_run["completed_at"] is not None

    letter_update = {"status": "sent"}
    letter_update_response = client.put(
        f"/api/v1/dispute-cases/{case_id}/letters/{letter['id']}",
        json=letter_update,
        headers=auth_headers,
    )
    assert letter_update_response.status_code == 200
    updated_letter = letter_update_response.json()
    assert updated_letter["status"] == "sent"
    assert updated_letter["sent_at"] is not None

    items_list = client.get(
        f"/api/v1/dispute-cases/{case_id}/items/", headers=auth_headers
    )
    assert items_list.status_code == 200
    assert len(items_list.json()) == 1

    letters_list = client.get(
        f"/api/v1/dispute-cases/{case_id}/letters/", headers=auth_headers
    )
    assert letters_list.status_code == 200
    assert len(letters_list.json()) == 1

    runs_list = client.get(
        "/api/v1/suggestion-runs/",
        params={"case_id": case_id},
        headers=auth_headers,
    )
    assert runs_list.status_code == 200
    assert len(runs_list.json()) >= 1

    archive_case = client.delete(
        f"/api/v1/dispute-cases/{case_id}", headers=auth_headers
    )
    assert archive_case.status_code == 204

    archived_case = client.get(
        f"/api/v1/dispute-cases/{case_id}", headers=auth_headers
    )
    assert archived_case.status_code == 404
