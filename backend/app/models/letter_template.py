import enum
import uuid

from sqlalchemy import Column, String, Text, Enum, Boolean, ForeignKey, Integer, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from .mixins import TimestampMixin, SoftDeleteMixin


class LetterTemplateCategory(enum.Enum):
    GENERAL = "general"
    DISPUTE = "dispute"
    FOLLOW_UP = "follow_up"
    ESCALATION = "escalation"
    COMPLIANCE = "compliance"


class LetterDeliveryChannel(enum.Enum):
    MAIL = "mail"
    EMAIL = "email"
    FAX = "fax"


class LetterTemplate(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "letter_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    category = Column(Enum(LetterTemplateCategory), nullable=False, default=LetterTemplateCategory.DISPUTE)
    channel = Column(Enum(LetterDeliveryChannel), nullable=False, default=LetterDeliveryChannel.MAIL)
    version = Column(Integer, nullable=False, default=1)
    locale = Column(String, nullable=False, default="en-US")
    subject = Column(String)
    preview_text = Column(String)
    body = Column(Text, nullable=False)
    variables = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    is_active = Column(Boolean, nullable=False, default=True)

    tenant = relationship("Tenant", back_populates="letter_templates")
    letters = relationship("GeneratedLetter", back_populates="template")

    __table_args__ = (
        Index("ix_letter_templates_tenant_slug", "tenant_id", "slug", unique=True),
        Index("ix_letter_templates_tenant", "tenant_id"),
    )
