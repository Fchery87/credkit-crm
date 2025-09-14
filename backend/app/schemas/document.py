from pydantic import BaseModel
from datetime import datetime
import uuid
from ..models.document import DocumentType, DocumentStatus


class DocumentResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID | None
    dispute_id: uuid.UUID | None
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    document_type: DocumentType
    status: DocumentStatus
    s3_url: str
    uploaded_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    document_type: DocumentType
    client_id: uuid.UUID | None = None
    dispute_id: uuid.UUID | None = None


class DocumentShareResponse(BaseModel):
    share_url: str
    share_token: str
    expires_at: datetime
    max_downloads: int