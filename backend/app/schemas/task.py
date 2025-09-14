from pydantic import BaseModel
from datetime import date
import uuid
from ..models.task import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: date | None = None
    client_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: date | None = None
    assigned_to: uuid.UUID | None = None


class Task(TaskBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_by: uuid.UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True