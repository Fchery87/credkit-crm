from pydantic import BaseModel
from datetime import datetime
import uuid
from ..models.reminder import ReminderType, ReminderStatus


class ReminderBase(BaseModel):
    title: str
    message: str | None = None
    reminder_type: ReminderType = ReminderType.IN_APP
    scheduled_at: datetime
    client_id: uuid.UUID | None = None
    task_id: uuid.UUID | None = None
    user_id: uuid.UUID


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    reminder_type: ReminderType | None = None
    scheduled_at: datetime | None = None
    status: ReminderStatus | None = None


class Reminder(ReminderBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: ReminderStatus
    sent_at: datetime | None = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True