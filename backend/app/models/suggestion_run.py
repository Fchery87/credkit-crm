import enum
import uuid

from sqlalchemy import Column, String, Text, Enum, ForeignKey, Float, DateTime, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from .mixins import TimestampMixin, SoftDeleteMixin


class SuggestionEngine(enum.Enum):
    RULES = "rules"
    GPT = "gpt"
    CLAUDE = "claude"
    CUSTOM = "custom"


class SuggestionRunStatus(enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SuggestionRun(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "suggestion_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("dispute_cases.id"), nullable=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("dispute_items.id"))
    letter_id = Column(UUID(as_uuid=True), ForeignKey("generated_letters.id"))

    engine = Column(Enum(SuggestionEngine), nullable=False, default=SuggestionEngine.RULES)
    status = Column(Enum(SuggestionRunStatus), nullable=False, default=SuggestionRunStatus.QUEUED)
    prompt = Column(Text)
    result = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    suggestions = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    score = Column(Float)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error = Column(Text)

    tenant = relationship("Tenant", back_populates="suggestion_runs")
    client = relationship("Client", back_populates="suggestion_runs")
    case = relationship("DisputeCase", back_populates="suggestion_runs")
    item = relationship("DisputeItem", back_populates="suggestion_runs")
    letter = relationship("GeneratedLetter", back_populates="suggestion_runs")

    __table_args__ = (
        Index("ix_suggestion_runs_tenant_case", "tenant_id", "case_id"),
        Index("ix_suggestion_runs_tenant_client", "tenant_id", "client_id"),
        Index("ix_suggestion_runs_result", "result", postgresql_using="gin"),
    )
