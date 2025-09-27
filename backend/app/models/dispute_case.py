import enum
import uuid

from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from .mixins import TimestampMixin, SoftDeleteMixin


class DisputeCaseStatus(enum.Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class DisputeCasePriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DisputeCase(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "dispute_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_number = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(DisputeCaseStatus), nullable=False, default=DisputeCaseStatus.OPEN)
    priority = Column(Enum(DisputeCasePriority), nullable=False, default=DisputeCasePriority.MEDIUM)
    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True))
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenant", back_populates="dispute_cases")
    client = relationship("Client", back_populates="dispute_cases")
    items = relationship("DisputeItem", back_populates="case", cascade="all, delete-orphan")
    letters = relationship("GeneratedLetter", back_populates="case")
    suggestion_runs = relationship("SuggestionRun", back_populates="case")

    __table_args__ = (
        UniqueConstraint("tenant_id", "case_number", name="uq_dispute_case_number_per_tenant"),
        Index("ix_dispute_cases_tenant_client", "tenant_id", "client_id"),
    )
