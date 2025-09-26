from datetime import datetime
import uuid
from typing import Any

from pydantic import BaseModel, Field

from ..models.generated_letter import GeneratedLetterStatus


class GeneratedLetterBase(BaseModel):
    item_id: uuid.UUID | None = None
    template_id: uuid.UUID | None = None
    reference_code: str | None = None
    status: GeneratedLetterStatus = GeneratedLetterStatus.DRAFT
    subject: str | None = None
    body: str | None = None
    render_context: dict[str, Any] = Field(default_factory=dict)
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    sent_at: datetime | None = None
    delivered_at: datetime | None = None


class GeneratedLetterCreate(GeneratedLetterBase):
    pass


class GeneratedLetterUpdate(BaseModel):
    item_id: uuid.UUID | None = None
    template_id: uuid.UUID | None = None
    reference_code: str | None = None
    status: GeneratedLetterStatus | None = None
    subject: str | None = None
    body: str | None = None
    render_context: dict[str, Any] | None = None
    attachments: list[dict[str, Any]] | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None


class GeneratedLetter(GeneratedLetterBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID
    case_id: uuid.UUID
    reference_code: str
    body: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
