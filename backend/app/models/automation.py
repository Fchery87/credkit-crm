import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AutomationTrigger(enum.Enum):
    CLIENT_STAGE_CHANGED = "client_stage_changed"
    TASK_COMPLETED = "task_completed"
    DISPUTE_STATUS_CHANGED = "dispute_status_changed"
    REMINDER_DUE = "reminder_due"


class AutomationAction(enum.Enum):
    CREATE_TASK = "create_task"
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    UPDATE_CLIENT_STAGE = "update_client_stage"
    CREATE_REMINDER = "create_reminder"


class Automation(Base):
    __tablename__ = "automations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    trigger = Column(Enum(AutomationTrigger), nullable=False)
    action = Column(Enum(AutomationAction), nullable=False)
    conditions = Column(JSON)  # Store trigger conditions as JSON
    parameters = Column(JSON)  # Store action parameters as JSON
    is_active = Column(Boolean, default=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="automations")
    creator = relationship("User")