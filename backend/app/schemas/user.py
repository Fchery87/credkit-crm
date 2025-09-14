from pydantic import BaseModel, EmailStr
import uuid


class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(UserBase):
    password: str
    organization_name: str


class User(UserBase):
    id: uuid.UUID
    is_active: bool
    tenant_id: uuid.UUID
    organization_id: uuid.UUID
    role: str

    class Config:
        from_attributes = True
