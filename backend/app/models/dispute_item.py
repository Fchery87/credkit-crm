import enum
import uuid

from sqlalchemy import Column, String, Text, Enum, ForeignKey, Integer, Numeric, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base
from .mixins import TimestampMixin, SoftDeleteMixin


class CreditBureau(enum.Enum):
    EXPERIAN = "experian"
    EQUIFAX = "equifax"
    TRANSUNION = "transunion"
    INNOVIS = "innovis"
    OTHER = "other"


class DisputeItemType(enum.Enum):
    ACCOUNT = "account"
    INQUIRY = "inquiry"
    PUBLIC_RECORD = "public_record"
    PERSONAL_INFORMATION = "personal_information"
    CUSTOM = "custom"


class DisputeItemStatus(enum.Enum):
    DRAFT = "draft"
    READY = "ready"
    SENT = "sent"
    PENDING_RESPONSE = "pending_response"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class DisputeItem(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "dispute_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("dispute_cases.id"), nullable=False)

    label = Column(String, nullable=False)
    bureau = Column(Enum(CreditBureau), nullable=False)
    item_type = Column(Enum(DisputeItemType), nullable=False)
    status = Column(Enum(DisputeItemStatus), nullable=False, default=DisputeItemStatus.DRAFT)
    account_number = Column(String)
    amount = Column(Numeric(12, 2))
    position = Column(Integer)
    notes = Column(Text)

    dispute_reason_codes = Column(ARRAY(Integer))
    details = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    data_snapshot = Column(JSONB)

    tenant = relationship("Tenant", back_populates="dispute_items")
    client = relationship("Client", back_populates="dispute_items")
    case = relationship("DisputeCase", back_populates="items")
    letters = relationship("GeneratedLetter", back_populates="item")
    suggestion_runs = relationship("SuggestionRun", back_populates="item")

    __table_args__ = (
        Index("ix_dispute_items_tenant_case", "tenant_id", "case_id"),
        Index("ix_dispute_items_tenant_client", "tenant_id", "client_id"),
        Index("ix_dispute_items_reason_codes", "dispute_reason_codes", postgresql_using="gin"),
        Index("ix_dispute_items_details", "details", postgresql_using="gin"),
    )
