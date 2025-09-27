import uuid
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DocumentType(enum.Enum):
    CREDIT_REPORT = "credit_report"
    DISPUTE_LETTER = "dispute_letter"
    IDENTITY_DOCUMENT = "identity_document"
    PROOF_OF_ADDRESS = "proof_of_address"
    SUPPORTING_DOCUMENT = "supporting_document"
    INVOICE = "invoice"
    CONTRACT = "contract"
    OTHER = "other"


class DocumentStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    ARCHIVED = "archived"


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=True)
    
    # Document metadata
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer)  # Size in bytes
    mime_type = Column(String)
    document_type = Column(Enum(DocumentType), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED)
    
    # S3 storage information
    s3_bucket = Column(String)
    s3_key = Column(String, nullable=False)  # S3 object key
    s3_url = Column(String)  # Pre-signed URL or public URL
    s3_etag = Column(String)  # S3 ETag for integrity checking
    
    # Security and access
    is_encrypted = Column(Boolean, default=True)
    encryption_key_id = Column(String)  # KMS key ID if using AWS KMS
    access_level = Column(String, default="private")  # private, tenant, public
    
    # Document processing
    extracted_text = Column(Text)  # OCR or text extraction results
    processing_metadata = Column(JSON)  # Additional processing info
    
    # Audit trail
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="documents")
    client = relationship("Client", back_populates="documents")
    dispute = relationship("Dispute", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")


class DocumentShare(Base):
    __tablename__ = "document_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Share details
    share_token = Column(String, unique=True, nullable=False)  # Unique token for access
    expires_at = Column(DateTime(timezone=True))
    max_downloads = Column(Integer, default=1)
    download_count = Column(Integer, default=0)
    
    # Access control
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String)
    
    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed = Column(DateTime(timezone=True))

    # Relationships
    document = relationship("Document")
    creator = relationship("User")
