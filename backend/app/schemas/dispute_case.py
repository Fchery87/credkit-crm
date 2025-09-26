from datetime import datetime
import uuid

from pydantic import BaseModel

from ..models.dispute_case import DisputeCasePriority, DisputeCaseStatus


class DisputeCaseBase(BaseModel):
    title: str
    description: str | None = None
    case_number: str | None = None
    status: DisputeCaseStatus = DisputeCaseStatus.OPEN
    priority: DisputeCasePriority = DisputeCasePriority.MEDIUM
    client_id: uuid.UUID


class DisputeCaseCreate(DisputeCaseBase):
    opened_at: datetime | None = None


class DisputeCaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    case_number: str | None = None
    status: DisputeCaseStatus | None = None
    priority: DisputeCasePriority | None = None
    client_id: uuid.UUID | None = None
    closed_at: datetime | None = None


class DisputeCase(DisputeCaseBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    case_number: str
    opened_at: datetime
    closed_at: datetime | None = None
    last_activity_at: datetime
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
