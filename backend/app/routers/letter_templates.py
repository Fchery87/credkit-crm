from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_active_user
from ..models.letter_template import (
    LetterTemplate as LetterTemplateModel,
    LetterTemplateCategory,
    LetterDeliveryChannel,
)
from ..models.user import User
from ..schemas.letter_template import (
    LetterTemplate as LetterTemplateSchema,
    LetterTemplateCreate,
    LetterTemplateUpdate,
)

router = APIRouter()


def _get_template(
    db: Session, tenant_id: uuid.UUID, template_id: uuid.UUID
) -> LetterTemplateModel:
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
    return template


@router.post("/", response_model=LetterTemplateSchema, status_code=status.HTTP_201_CREATED)
def create_letter_template(
    payload: LetterTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tenant_id = current_user.tenant_id

    exists = (
        db.query(LetterTemplateModel)
        .filter(
            LetterTemplateModel.tenant_id == tenant_id,
            LetterTemplateModel.slug == payload.slug,
            LetterTemplateModel.deleted_at.is_(None),
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Slug already in use")

    template = LetterTemplateModel(
        tenant_id=tenant_id,
        name=payload.name,
        slug=payload.slug,
        category=payload.category,
        channel=payload.channel,
        version=payload.version,
        locale=payload.locale,
        subject=payload.subject,
        preview_text=payload.preview_text,
        body=payload.body,
        variables=payload.variables,
        is_active=payload.is_active,
    )

    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/", response_model=list[LetterTemplateSchema])
def list_letter_templates(
    category: LetterTemplateCategory | None = None,
    channel: LetterDeliveryChannel | None = None,
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(LetterTemplateModel).filter(
        LetterTemplateModel.tenant_id == current_user.tenant_id
    )

    if not include_archived:
        query = query.filter(LetterTemplateModel.deleted_at.is_(None))

    if category:
        query = query.filter(LetterTemplateModel.category == category)

    if channel:
        query = query.filter(LetterTemplateModel.channel == channel)

    return (
        query.order_by(LetterTemplateModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{template_id}", response_model=LetterTemplateSchema)
def get_letter_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return _get_template(db, current_user.tenant_id, template_id)


@router.put("/{template_id}", response_model=LetterTemplateSchema)
def update_letter_template(
    template_id: uuid.UUID,
    payload: LetterTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    template = _get_template(db, current_user.tenant_id, template_id)

    if payload.slug and payload.slug != template.slug:
        exists = (
            db.query(LetterTemplateModel)
            .filter(
                LetterTemplateModel.tenant_id == current_user.tenant_id,
                LetterTemplateModel.slug == payload.slug,
                LetterTemplateModel.id != template.id,
                LetterTemplateModel.deleted_at.is_(None),
            )
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Slug already in use")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_letter_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    template = _get_template(db, current_user.tenant_id, template_id)
    template.deleted_at = datetime.utcnow()
    template.is_active = False

    db.commit()
    return None
