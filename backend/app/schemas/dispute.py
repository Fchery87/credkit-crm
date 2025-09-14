from pydantic import BaseModel
import uuid
from ..models.dispute import DisputeStatus

class DisputeBase(BaseModel):
    title: str
    status: DisputeStatus = DisputeStatus.DRAFT

class DisputeCreate(DisputeBase):
    client_id: uuid.UUID

class Dispute(DisputeBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
