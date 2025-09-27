import enum
import uuid

from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from .mixins import TimestampMixin, SoftDeleteMixin


class GeneratedLetterStatus(enum.Enum):
    DRAFT = "draft"
    RENDERED = "rendered"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class GeneratedLetter(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "generated_letters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("dispute_cases.id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("dispute_items.id"), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("letter_templates.id"), nullable=True)

    reference_code = Column(String, nullable=False)
    status = Column(Enum(GeneratedLetterStatus), nullable=False, default=GeneratedLetterStatus.DRAFT)
    subject = Column(String)
    body = Column(Text, nullable=False)
    render_context = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    attachments = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))

    tenant = relationship("Tenant", back_populates="generated_letters")
    client = relationship("Client", back_populates="generated_letters")
    case = relationship("DisputeCase", back_populates="letters")
    item = relationship("DisputeItem", back_populates="letters")
    template = relationship("LetterTemplate", back_populates="letters")
    suggestion_runs = relationship("SuggestionRun", back_populates="letter")

    __table_args__ = (
        Index("ix_generated_letters_tenant_case", "tenant_id", "case_id"),
        Index("ix_generated_letters_tenant_client", "tenant_id", "client_id"),
        Index("ix_generated_letters_render_context", "render_context", postgresql_using="gin"),
    )
