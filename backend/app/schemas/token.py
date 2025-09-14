from pydantic import BaseModel
import uuid


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None
    tenant_id: uuid.UUID | None = None
