from typing import Any
from pydantic import BaseModel, Field


class DisputeSuggestion(BaseModel):
    item_type: str
    bureaus: list[str] = Field(default_factory=list)
    furnisher: str | None = None
    account_ref: str | None = None
    reason_codes: list[str] = Field(default_factory=list)
    evidence: dict[str, Any] = Field(default_factory=dict)


class DisputeSuggestionsResponse(BaseModel):
    suggestions: list[DisputeSuggestion]
    run_id: str


class DisputeSuggestionsEmptyResponse(BaseModel):
    suggestions: list[DisputeSuggestion] = Field(default_factory=list)
    run_id: str | None = None
