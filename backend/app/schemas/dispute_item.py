from datetime import datetime
from decimal import Decimal
import uuid
from typing import Any

from pydantic import BaseModel, Field

from ..models.dispute_item import (
    CreditBureau,
    DisputeItemStatus,
    DisputeItemType,
)


class DisputeItemBase(BaseModel):
    label: str
    bureau: CreditBureau
    item_type: DisputeItemType
    status: DisputeItemStatus = DisputeItemStatus.DRAFT
    account_number: str | None = None
    amount: Decimal | None = None
    position: int | None = None
    notes: str | None = None
    dispute_reason_codes: list[int] | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    data_snapshot: dict[str, Any] | None = None


class DisputeItemCreate(DisputeItemBase):
    pass


class DisputeItemUpdate(BaseModel):
    label: str | None = None
    bureau: CreditBureau | None = None
    item_type: DisputeItemType | None = None
    status: DisputeItemStatus | None = None
    account_number: str | None = None
    amount: Decimal | None = None
    position: int | None = None
    notes: str | None = None
    dispute_reason_codes: list[int] | None = None
    details: dict[str, Any] | None = None
    data_snapshot: dict[str, Any] | None = None


class DisputeItem(DisputeItemBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID
    case_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
