import uuid
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AuditAction(enum.Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    SHARE = "share"
    DOWNLOAD = "download"


class AuditResourceType(enum.Enum):
    USER = "user"
    CLIENT = "client"
    TASK = "task"
    DISPUTE = "dispute"
    DOCUMENT = "document"
    SUBSCRIPTION = "subscription"
    INVOICE = "invoice"
    REMINDER = "reminder"
    TAG = "tag"
    STAGE = "stage"
    AUTOMATION = "automation"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Action details
    action = Column(Enum(AuditAction), nullable=False)
    resource_type = Column(Enum(AuditResourceType), nullable=False)
    resource_id = Column(String)  # ID of the affected resource
    
    # User information
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user_email = Column(String)  # Store email for audit trail even if user is deleted
    user_role = Column(String)
    
    # Request details
    ip_address = Column(String)
    user_agent = Column(String)
    request_method = Column(String)
    request_path = Column(String)
    
    # Change tracking
    old_values = Column(JSON)  # Previous state of the resource
    new_values = Column(JSON)  # New state of the resource
    changes = Column(JSON)     # Specific fields that changed
    
    # Additional context
    description = Column(Text)
    event_metadata = Column(JSON)    # Additional context-specific data
    
    # Compliance fields
    is_sensitive = Column(Boolean, default=False)  # Mark sensitive data access
    retention_date = Column(DateTime(timezone=True))  # When this log can be purged
    
    # Immutable timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")


class DataAccessLog(Base):
    __tablename__ = "data_access_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Access details
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resource_type = Column(Enum(AuditResourceType), nullable=False)
    resource_id = Column(String, nullable=False)
    
    # Sensitive data fields accessed
    fields_accessed = Column(JSON)  # List of sensitive fields viewed
    
    # Access context
    access_reason = Column(String)  # Business justification for access
    ip_address = Column(String)
    user_agent = Column(String)
    
    # Compliance
    is_authorized = Column(Boolean, default=True)
    consent_given = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    user = relationship("User")


class ComplianceEvent(Base):
    __tablename__ = "compliance_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Event details
    event_type = Column(String, nullable=False)  # GDPR_REQUEST, DATA_BREACH, CONSENT_CHANGE, etc.
    severity = Column(String, default="INFO")    # INFO, WARNING, CRITICAL
    
    # Affected data
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Event description
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Response and resolution
    response_required = Column(Boolean, default=False)
    response_deadline = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    resolution_notes = Column(Text)
    
    # Metadata
    event_data = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant")
    client = relationship("Client")
    user = relationship("User")
