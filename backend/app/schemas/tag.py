from pydantic import BaseModel
import uuid


class TagBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class Tag(TagBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True