from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_active_user
from ..models.dispute_case import DisputeCase as DisputeCaseModel
from ..models.dispute_item import DisputeItem as DisputeItemModel
from ..models.generated_letter import (
    GeneratedLetter as GeneratedLetterModel,
    GeneratedLetterStatus,
)
from ..models.letter_template import LetterTemplate as LetterTemplateModel
from ..models.user import User
from ..schemas.generated_letter import (
    GeneratedLetter as GeneratedLetterSchema,
    GeneratedLetterCreate,
    GeneratedLetterUpdate,
)

router = APIRouter()


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


def _get_letter(
    db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID, letter_id: uuid.UUID
) -> GeneratedLetterModel:
    letter = (
        db.query(GeneratedLetterModel)
        .filter(
            GeneratedLetterModel.id == letter_id,
            GeneratedLetterModel.case_id == case_id,
            GeneratedLetterModel.tenant_id == tenant_id,
            GeneratedLetterModel.deleted_at.is_(None),
        )
        .first()
    )
    if not letter:
        raise HTTPException(status_code=404, detail="Generated letter not found")
    return letter


def _ensure_item(
    db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID, item_id: uuid.UUID | None
) -> DisputeItemModel | None:
    if item_id is None:
        return None
    item = (
        db.query(DisputeItemModel)
        .filter(
            DisputeItemModel.id == item_id,
            DisputeItemModel.case_id == case_id,
            DisputeItemModel.tenant_id == tenant_id,
            DisputeItemModel.deleted_at.is_(None),
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Dispute item not found for this case")
    return item


def _ensure_template(
    db: Session, tenant_id: uuid.UUID, template_id: uuid.UUID | None
) -> LetterTemplateModel | None:
    if template_id is None:
        return None
    template = (
        db.query(LetterTemplateModel)
        .filter(
            LetterTemplateModel.id == template_id,
            LetterTemplateModel.tenant_id == tenant_id,
            LetterTemplateModel.deleted_at.is_(None),
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Letter template not found")
    if not template.is_active:
        raise HTTPException(status_code=400, detail="Letter template is inactive")
    return template


@router.post("/", response_model=GeneratedLetterSchema, status_code=status.HTTP_201_CREATED)
def create_generated_letter(
    case_id: uuid.UUID,
    payload: GeneratedLetterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)
    item = _ensure_item(db, current_user.tenant_id, case.id, payload.item_id)
    template = _ensure_template(db, current_user.tenant_id, payload.template_id)

    reference_code = payload.reference_code or f"LET-{uuid.uuid4().hex[:8].upper()}"
    subject = payload.subject or (template.subject if template else None)
    body = payload.body or (template.body if template else None)

    if not body:
        raise HTTPException(status_code=400, detail="Letter body is required")

    letter = GeneratedLetterModel(
        tenant_id=case.tenant_id,
        client_id=case.client_id,
        case_id=case.id,
        item_id=item.id if item else None,
        template_id=template.id if template else None,
        reference_code=reference_code,
        status=payload.status,
        subject=subject,
        body=body,
        render_context=payload.render_context,
        attachments=payload.attachments,
        sent_at=payload.sent_at,
        delivered_at=payload.delivered_at,
    )

    db.add(letter)
    case.last_activity_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(letter)
    return letter


@router.get("/", response_model=list[GeneratedLetterSchema])
def list_generated_letters(
    case_id: uuid.UUID,
    status_filter: GeneratedLetterStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _get_case(db, current_user.tenant_id, case_id)

    query = db.query(GeneratedLetterModel).filter(
        GeneratedLetterModel.case_id == case_id,
        GeneratedLetterModel.tenant_id == current_user.tenant_id,
        GeneratedLetterModel.deleted_at.is_(None),
    )

    if status_filter:
        query = query.filter(GeneratedLetterModel.status == status_filter)

    return query.order_by(GeneratedLetterModel.created_at.desc()).all()


@router.get("/{letter_id}", response_model=GeneratedLetterSchema)
def get_generated_letter(
    case_id: uuid.UUID,
    letter_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _get_case(db, current_user.tenant_id, case_id)
    return _get_letter(db, current_user.tenant_id, case_id, letter_id)


@router.put("/{letter_id}", response_model=GeneratedLetterSchema)
def update_generated_letter(
    case_id: uuid.UUID,
    letter_id: uuid.UUID,
    payload: GeneratedLetterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)
    letter = _get_letter(db, current_user.tenant_id, case_id, letter_id)

    if payload.item_id is not None:
        _ensure_item(db, current_user.tenant_id, case.id, payload.item_id)
    if payload.template_id is not None:
        template = _ensure_template(db, current_user.tenant_id, payload.template_id)
        if payload.body is None:
            # allow switching templates without overriding explicit body
            payload.body = letter.body if letter.body else template.body
        if payload.subject is None:
            payload.subject = template.subject

    data = payload.dict(exclude_unset=True)

    if "status" in data:
        new_status = data["status"]
        if new_status == GeneratedLetterStatus.SENT and not data.get("sent_at"):
            data["sent_at"] = datetime.now(timezone.utc)
        if new_status == GeneratedLetterStatus.DELIVERED and not data.get("delivered_at"):
            data["delivered_at"] = datetime.now(timezone.utc)

    for field, value in data.items():
        setattr(letter, field, value)

    case.last_activity_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(letter)
    return letter


@router.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_generated_letter(
    case_id: uuid.UUID,
    letter_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)
    letter = _get_letter(db, current_user.tenant_id, case_id, letter_id)

    letter.deleted_at = datetime.now(timezone.utc)
    case.last_activity_at = letter.deleted_at

    db.commit()
    return None

