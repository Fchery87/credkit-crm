from pydantic import BaseModel
import uuid

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: uuid.UUID
    created_at: str

    class Config:
        orm_mode = True
