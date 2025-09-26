from datetime import datetime
import uuid
from typing import Any

from pydantic import BaseModel, Field

from ..models.letter_template import LetterDeliveryChannel, LetterTemplateCategory


class LetterTemplateBase(BaseModel):
    name: str
    slug: str
    category: LetterTemplateCategory = LetterTemplateCategory.DISPUTE
    channel: LetterDeliveryChannel = LetterDeliveryChannel.MAIL
    version: int = 1
    locale: str = "en-US"
    subject: str | None = None
    preview_text: str | None = None
    body: str
    variables: list[dict[str, Any]] = Field(default_factory=list)
    is_active: bool = True


class LetterTemplateCreate(LetterTemplateBase):
    pass


class LetterTemplateUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    category: LetterTemplateCategory | None = None
    channel: LetterDeliveryChannel | None = None
    version: int | None = None
    locale: str | None = None
    subject: str | None = None
    preview_text: str | None = None
    body: str | None = None
    variables: list[dict[str, Any]] | None = None
    is_active: bool | None = None


class LetterTemplate(LetterTemplateBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
