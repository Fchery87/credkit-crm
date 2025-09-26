import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    createdAt = Column("created_at", DateTime, server_default=func.now())

    users = relationship("User", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    disputes = relationship("Dispute", back_populates="tenant")
    dispute_cases = relationship("DisputeCase", back_populates="tenant")
    dispute_items = relationship("DisputeItem", back_populates="tenant")
    generated_letters = relationship("GeneratedLetter", back_populates="tenant")
    letter_templates = relationship("LetterTemplate", back_populates="tenant")
    suggestion_runs = relationship("SuggestionRun", back_populates="tenant")
    tasks = relationship("Task", back_populates="tenant")
    tags = relationship("Tag", back_populates="tenant")
    stages = relationship("Stage", back_populates="tenant")
    reminders = relationship("Reminder", back_populates="tenant")
    automations = relationship("Automation", back_populates="tenant")
    documents = relationship("Document", back_populates="tenant")
    audit_logs = relationship("AuditLog", back_populates="tenant")
    subscription = relationship("Subscription", back_populates="tenant", uselist=False)
    invoices = relationship("Invoice", back_populates="tenant")

