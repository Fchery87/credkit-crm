from __future__ import annotations

import argparse
import uuid
from datetime import datetime

from app.database import SessionLocal
from app.models.client import Client
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.tenant import Tenant
from app.models.user import User
from app.services.dispute_suggestions import generate_dispute_suggestions
from app.seed_data import clear_seed_data, create_seed_data


DEMO_SNAPSHOT = {
    "generated_at": datetime.utcnow().isoformat(),
    "tradelines": [
        {
            "account_ref": "ACC-BOOT-001",
            "account_number": "BOOT-001",
            "furnisher": "Example Bank",
            "overall_status": "open",
            "bureaus": {
                "EXPERIAN": {
                    "status": "late",
                    "balance": 1200,
                    "credit_limit": 1000,
                    "late_counts": {"30": 2},
                    "dofd": "2018-01-01",
                },
                "EQUIFAX": {
                    "status": "current",
                    "balance": 900,
                    "credit_limit": 1000,
                    "late_counts": {},
                    "dofd": "2018-01-01",
                },
            },
        }
    ],
    "collections": [
        {
            "account_ref": "COLL-BOOT-001",
            "furnisher": "Collections Agency",
            "bureaus": {
                "EXPERIAN": {
                    "status": "collection",
                    "dofd": "2015-06-01",
                }
            },
        }
    ],
    "inquiries": [
        {
            "bureau": "EXPERIAN",
            "furnisher": "Auto Loans LLC",
            "type": "hard",
            "date": "2021-01-10",
        }
    ],
}


def _ensure_demo_snapshot(db, tenant: Tenant, client: Client, uploader: User) -> Document:
    document = (
        db.query(Document)
        .filter(
            Document.tenant_id == tenant.id,
            Document.client_id == client.id,
            Document.document_type == DocumentType.CREDIT_REPORT,
            Document.status == DocumentStatus.PROCESSED,
        )
        .order_by(Document.created_at.desc())
        .first()
    )
    if document:
        return document

    document = Document(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        client_id=client.id,
        filename="demo-credit-report.json",
        original_filename="demo-credit-report.json",
        document_type=DocumentType.CREDIT_REPORT,
        status=DocumentStatus.PROCESSED,
        s3_key=f"seed/snapshots/{uuid.uuid4()}.json",
        uploaded_by=uploader.id,
        processing_metadata={"normalized_snapshot": DEMO_SNAPSHOT},
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def main(force: bool = False) -> None:
    if force:
        clear_seed_data()
    create_seed_data()

    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.name == "Demo Credit Repair Co").first()
        if tenant is None:
            raise RuntimeError("Demo tenant not found after seeding")

        admin_user = db.query(User).filter(User.email == "admin@demo.com").first()
        if admin_user is None:
            raise RuntimeError("Demo admin user not found")

        client = (
            db.query(Client)
            .filter(Client.tenant_id == tenant.id)
            .order_by(Client.created_at.asc())
            .first()
        )
        if client is None:
            raise RuntimeError("Demo client not found; seed_data may have failed")

        document = _ensure_demo_snapshot(db, tenant, client, admin_user)
        print(
            "Prepared credit report snapshot %s for client %s %s"
            % (document.id, client.first_name, client.last_name)
        )

        suggestions, run = generate_dispute_suggestions(
            db,
            tenant_id=tenant.id,
            client_id=client.id,
        )
        print(f"Generated {len(suggestions)} suggestions (run {run.id})")
    finally:
        db.close()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bootstrap demo data and snapshots")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clear existing demo data before seeding",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    main(force=args.force)
