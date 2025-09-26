from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_active_user
from ..models.client import Client
from ..models.dispute_case import DisputeCase as DisputeCaseModel, DisputeCaseStatus
from ..models.dispute_item import DisputeItem as DisputeItemModel
from ..models.generated_letter import GeneratedLetter as GeneratedLetterModel
from ..models.suggestion_run import SuggestionRun as SuggestionRunModel
from ..models.user import User
from ..schemas.dispute_case import DisputeCase as DisputeCaseSchema
from ..schemas.dispute_case import DisputeCaseCreate, DisputeCaseUpdate

router = APIRouter()


def _generate_case_number() -> str:
    return f"CASE-{uuid.uuid4().hex[:8].upper()}"


def _get_case(db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID) -> DisputeCaseModel:
    case = (
        db.query(DisputeCaseModel)
        .filter(
            DisputeCaseModel.id == case_id,
            DisputeCaseModel.tenant_id == tenant_id,
            DisputeCaseModel.deleted_at.is_(None),
        )
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Dispute case not found")
    return case


@router.post("/", response_model=DisputeCaseSchema, status_code=status.HTTP_201_CREATED)
def create_dispute_case(
    payload: DisputeCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tenant_id = current_user.tenant_id

    client = (
        db.query(Client)
        .filter(Client.id == payload.client_id, Client.tenant_id == tenant_id)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found for this tenant")

    case_number = payload.case_number or _generate_case_number()
    existing = (
        db.query(DisputeCaseModel)
        .filter(
            DisputeCaseModel.tenant_id == tenant_id,
            DisputeCaseModel.case_number == case_number,
            DisputeCaseModel.deleted_at.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Case number already in use")

    now = datetime.now(timezone.utc)
    opened_at = payload.opened_at or now

    dispute_case = DisputeCaseModel(
        tenant_id=tenant_id,
        client_id=client.id,
        case_number=case_number,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        opened_at=opened_at,
        last_activity_at=opened_at,
    )

    db.add(dispute_case)
    db.commit()
    db.refresh(dispute_case)
    return dispute_case


@router.get("/", response_model=list[DisputeCaseSchema])
def list_dispute_cases(
    status_filter: DisputeCaseStatus | None = None,
    client_id: uuid.UUID | None = None,
    search: str | None = None,
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(DisputeCaseModel).filter(
        DisputeCaseModel.tenant_id == current_user.tenant_id
    )

    if not include_archived:
        query = query.filter(DisputeCaseModel.deleted_at.is_(None))

    if status_filter:
        query = query.filter(DisputeCaseModel.status == status_filter)

    if client_id:
        query = query.filter(DisputeCaseModel.client_id == client_id)

    if search:
        ilike_term = f"%{search}%"
        query = query.filter(
            (DisputeCaseModel.title.ilike(ilike_term))
            | (DisputeCaseModel.case_number.ilike(ilike_term))
        )

    return (
        query.order_by(DisputeCaseModel.opened_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{case_id}", response_model=DisputeCaseSchema)
def get_dispute_case(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return _get_case(db, current_user.tenant_id, case_id)


@router.put("/{case_id}", response_model=DisputeCaseSchema)
def update_dispute_case(
    case_id: uuid.UUID,
    payload: DisputeCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute_case = _get_case(db, current_user.tenant_id, case_id)
    updated = False

    if payload.case_number and payload.case_number != dispute_case.case_number:
        existing = (
            db.query(DisputeCaseModel)
            .filter(
                DisputeCaseModel.tenant_id == current_user.tenant_id,
                DisputeCaseModel.case_number == payload.case_number,
                DisputeCaseModel.id != dispute_case.id,
                DisputeCaseModel.deleted_at.is_(None),
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Case number already in use")

    if payload.client_id and payload.client_id != dispute_case.client_id:
        client = (
            db.query(Client)
            .filter(
                Client.id == payload.client_id,
                Client.tenant_id == current_user.tenant_id,
            )
            .first()
        )
        if not client:
            raise HTTPException(status_code=404, detail="Client not found for this tenant")
        dispute_case.client_id = client.id
        updated = True

    for field, value in payload.dict(exclude_unset=True, exclude={"client_id"}).items():
        setattr(dispute_case, field, value)
        updated = True

    if updated:
        dispute_case.last_activity_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(dispute_case)
    return dispute_case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_dispute_case(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute_case = _get_case(db, current_user.tenant_id, case_id)
    now = datetime.now(timezone.utc)

    dispute_case.deleted_at = now
    if dispute_case.status != DisputeCaseStatus.ARCHIVED:
        dispute_case.status = DisputeCaseStatus.ARCHIVED
    dispute_case.last_activity_at = now

    db.query(DisputeItemModel).filter(
        DisputeItemModel.case_id == dispute_case.id,
        DisputeItemModel.deleted_at.is_(None),
    ).update({"deleted_at": now}, synchronize_session=False)

    db.query(GeneratedLetterModel).filter(
        GeneratedLetterModel.case_id == dispute_case.id,
        GeneratedLetterModel.deleted_at.is_(None),
    ).update({"deleted_at": now}, synchronize_session=False)

    db.query(SuggestionRunModel).filter(
        SuggestionRunModel.case_id == dispute_case.id,
        SuggestionRunModel.deleted_at.is_(None),
    ).update({"deleted_at": now}, synchronize_session=False)

    db.commit()
    return None

