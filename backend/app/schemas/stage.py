from pydantic import BaseModel
import uuid


class StageBase(BaseModel):
    name: str
    description: str | None = None
    order: int
    color: str = "#3B82F6"


class StageCreate(StageBase):
    pass


class StageUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order: int | None = None
    color: str | None = None


class Stage(StageBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True