from pydantic import BaseModel
import uuid

class ClientBase(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: str

    class Config:
        orm_mode = True
