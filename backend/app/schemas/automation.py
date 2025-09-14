from pydantic import BaseModel
import uuid
from typing import Any, Dict
from ..models.automation import AutomationTrigger, AutomationAction


class AutomationBase(BaseModel):
    name: str
    description: str | None = None
    trigger: AutomationTrigger
    action: AutomationAction
    conditions: Dict[str, Any] | None = None
    parameters: Dict[str, Any] | None = None
    is_active: bool = True


class AutomationCreate(AutomationBase):
    pass


class AutomationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    trigger: AutomationTrigger | None = None
    action: AutomationAction | None = None
    conditions: Dict[str, Any] | None = None
    parameters: Dict[str, Any] | None = None
    is_active: bool | None = None


class Automation(AutomationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_by: uuid.UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True