import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from .client_tag import client_tags

class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    tenant = relationship("Tenant", back_populates="clients")
    stage = relationship("Stage", back_populates="clients")
    disputes = relationship("Dispute", back_populates="client")
    dispute_cases = relationship("DisputeCase", back_populates="client")
    dispute_items = relationship("DisputeItem", back_populates="client")
    generated_letters = relationship("GeneratedLetter", back_populates="client")
    suggestion_runs = relationship("SuggestionRun", back_populates="client")
    tasks = relationship("Task", back_populates="client")
    tags = relationship("Tag", secondary=client_tags, back_populates="clients")
    reminders = relationship("Reminder", back_populates="client")
    documents = relationship("Document", back_populates="client")
