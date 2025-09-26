from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_active_user
from ..models.dispute_case import DisputeCase as DisputeCaseModel
from ..models.dispute_item import (
    DisputeItem as DisputeItemModel,
    DisputeItemStatus,
    DisputeItemType,
    CreditBureau,
)
from ..models.user import User
from ..schemas.dispute_item import (
    DisputeItem as DisputeItemSchema,
    DisputeItemCreate,
    DisputeItemUpdate,
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


def _get_item(
    db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID, item_id: uuid.UUID
) -> DisputeItemModel:
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
        raise HTTPException(status_code=404, detail="Dispute item not found")
    return item


@router.post("/", response_model=DisputeItemSchema, status_code=status.HTTP_201_CREATED)
def create_dispute_item(
    case_id: uuid.UUID,
    payload: DisputeItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)

    position = payload.position
    if position is None:
        max_position = (
            db.query(func.coalesce(func.max(DisputeItemModel.position), 0))
            .filter(
                DisputeItemModel.case_id == case.id,
                DisputeItemModel.deleted_at.is_(None),
            )
            .scalar()
        )
        position = (max_position or 0) + 1

    dispute_item = DisputeItemModel(
        tenant_id=case.tenant_id,
        client_id=case.client_id,
        case_id=case.id,
        label=payload.label,
        bureau=payload.bureau,
        item_type=payload.item_type,
        status=payload.status,
        account_number=payload.account_number,
        amount=payload.amount,
        position=position,
        notes=payload.notes,
        dispute_reason_codes=payload.dispute_reason_codes,
        details=payload.details,
        data_snapshot=payload.data_snapshot,
    )

    db.add(dispute_item)
    case.last_activity_at = datetime.utcnow()
    db.commit()
    db.refresh(dispute_item)
    return dispute_item


@router.get("/", response_model=list[DisputeItemSchema])
def list_dispute_items(
    case_id: uuid.UUID,
    status_filter: DisputeItemStatus | None = None,
    item_type: DisputeItemType | None = None,
    bureau: CreditBureau | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _get_case(db, current_user.tenant_id, case_id)

    query = db.query(DisputeItemModel).filter(
        DisputeItemModel.case_id == case_id,
        DisputeItemModel.tenant_id == current_user.tenant_id,
        DisputeItemModel.deleted_at.is_(None),
    )

    if status_filter:
        query = query.filter(DisputeItemModel.status == status_filter)
    if item_type:
        query = query.filter(DisputeItemModel.item_type == item_type)
    if bureau:
        query = query.filter(DisputeItemModel.bureau == bureau)

    return query.order_by(DisputeItemModel.position.asc()).all()


@router.get("/{item_id}", response_model=DisputeItemSchema)
def get_dispute_item(
    case_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _get_case(db, current_user.tenant_id, case_id)
    return _get_item(db, current_user.tenant_id, case_id, item_id)


@router.put("/{item_id}", response_model=DisputeItemSchema)
def update_dispute_item(
    case_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: DisputeItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)
    item = _get_item(db, current_user.tenant_id, case_id, item_id)

    updated = False
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(item, field, value)
        updated = True

    if updated:
        case.last_activity_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_dispute_item(
    case_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, case_id)
    item = _get_item(db, current_user.tenant_id, case_id, item_id)

    item.deleted_at = datetime.utcnow()
    case.last_activity_at = item.deleted_at

    db.commit()
    return None
