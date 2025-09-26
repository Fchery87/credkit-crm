from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import os
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User
from ..models.document import Document, DocumentType, DocumentStatus
from ..services.storage import storage_service
from ..schemas.document import DocumentResponse

router = APIRouter()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    client_id: Optional[str] = Form(None),
    dispute_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a document to S3 and store metadata in database"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (10MB limit)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Reset file pointer
    await file.seek(0)
    
    try:
        # Upload to S3
        upload_result = await storage_service.upload_file(
            file=file,
            tenant_id=str(current_user.tenant_id),
            document_type=document_type.value,
            client_id=client_id
        )
        
        # Create document record in database
        document = Document(
            tenant_id=current_user.tenant_id,
            client_id=client_id,
            dispute_id=dispute_id,
            filename=upload_result['filename'],
            original_filename=upload_result['original_filename'],
            file_size=upload_result['file_size'],
            mime_type=upload_result['mime_type'],
            document_type=document_type,
            status=DocumentStatus.UPLOADED,
            s3_bucket=upload_result['s3_bucket'],
            s3_key=upload_result['s3_key'],
            s3_url=upload_result['s3_url'],
            s3_etag=upload_result['s3_etag'],
            uploaded_by=current_user.id
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    document_type: Optional[DocumentType] = None,
    client_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List documents for the current tenant"""
    query = db.query(Document).filter(Document.tenant_id == current_user.tenant_id)
    
    if document_type:
        query = query.filter(Document.document_type == document_type)
    
    if client_id:
        query = query.filter(Document.client_id == client_id)
    
    documents = query.order_by(Document.created_at.desc()).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get document metadata"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate presigned URL for document download"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Generate presigned URL (valid for 1 hour)
        download_url = storage_service.generate_presigned_url(
            s3_key=document.s3_key,
            expiration=3600
        )
        
        return {
            "download_url": download_url,
            "filename": document.original_filename,
            "expires_in": 3600
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete document from S3 and database"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions (only admin or uploader can delete)
    if current_user.role not in ["admin"] and document.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
    
    try:
        # Delete from S3
        storage_service.delete_file(document.s3_key)
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")


@router.post("/{document_id}/share")
async def create_document_share(
    document_id: str,
    expires_hours: int = 24,
    max_downloads: int = 1,
    password: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a shareable link for a document"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Generate share token
    share_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    
    # Create document share record
    from ..models.document import DocumentShare
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    document_share = DocumentShare(
        document_id=document.id,
        share_token=share_token,
        expires_at=expires_at,
        max_downloads=max_downloads,
        password_protected=bool(password),
        password_hash=pwd_context.hash(password) if password else None,
        created_by=current_user.id
    )
    
    db.add(document_share)
    db.commit()
    
    share_url = f"{os.getenv('FRONTEND_URL')}/shared/{share_token}"
    
    return {
        "share_url": share_url,
        "share_token": share_token,
        "expires_at": expires_at,
        "max_downloads": max_downloads
    }


@router.get("/shared/{share_token}")
async def access_shared_document(
    share_token: str,
    password: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Access a shared document via token"""
    from ..models.document import DocumentShare
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Find document share
    document_share = db.query(DocumentShare).filter(
        DocumentShare.share_token == share_token
    ).first()
    
    if not document_share:
        raise HTTPException(status_code=404, detail="Invalid share link")
    
    # Check expiration
    if document_share.expires_at and datetime.now(timezone.utc) > document_share.expires_at:
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    # Check download limit
    if document_share.download_count >= document_share.max_downloads:
        raise HTTPException(status_code=429, detail="Download limit exceeded")
    
    # Check password if required
    if document_share.password_protected:
        if not password:
            raise HTTPException(status_code=401, detail="Password required")
        if not pwd_context.verify(password, document_share.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    # Get document
    document = db.query(Document).filter(Document.id == document_share.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Generate download URL
        download_url = storage_service.generate_presigned_url(
            s3_key=document.s3_key,
            expiration=300  # 5 minutes
        )
        
        # Update access tracking
        document_share.download_count += 1
        document_share.last_accessed = datetime.now(timezone.utc)
        db.commit()
        
        return {
            "download_url": download_url,
            "filename": document.original_filename,
            "file_size": document.file_size,
            "mime_type": document.mime_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to access document: {str(e)}")

