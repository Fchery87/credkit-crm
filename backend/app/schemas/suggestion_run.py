from datetime import datetime
import uuid
from typing import Any

from pydantic import BaseModel, Field

from ..models.suggestion_run import SuggestionEngine, SuggestionRunStatus


class SuggestionRunBase(BaseModel):
    case_id: uuid.UUID
    item_id: uuid.UUID | None = None
    letter_id: uuid.UUID | None = None
    engine: SuggestionEngine = SuggestionEngine.RULES
    status: SuggestionRunStatus = SuggestionRunStatus.QUEUED
    prompt: str | None = None
    result: dict[str, Any] = Field(default_factory=dict)
    suggestions: list[dict[str, Any]] = Field(default_factory=list)
    score: float | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None


class SuggestionRunCreate(SuggestionRunBase):
    pass


class SuggestionRunUpdate(BaseModel):
    item_id: uuid.UUID | None = None
    letter_id: uuid.UUID | None = None
    engine: SuggestionEngine | None = None
    status: SuggestionRunStatus | None = None
    prompt: str | None = None
    result: dict[str, Any] | None = None
    suggestions: list[dict[str, Any]] | None = None
    score: float | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None


class SuggestionRun(SuggestionRunBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
