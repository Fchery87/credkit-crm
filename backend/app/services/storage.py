import boto3
import uuid
import os
from typing import Optional
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
import mimetypes
from datetime import datetime

class S3StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            endpoint_url=os.getenv('S3_ENDPOINT_URL')  # For S3-compatible services like MinIO
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'credkit-documents')
        
    async def upload_file(
        self,
        file: UploadFile,
        tenant_id: str,
        document_type: str,
        client_id: Optional[str] = None
    ) -> dict:
        """Upload file to S3 and return metadata"""
        try:
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create S3 key with organized structure
            s3_key = f"tenants/{tenant_id}/{document_type}/"
            if client_id:
                s3_key += f"clients/{client_id}/"
            s3_key += unique_filename
            
            # Read file content
            file_content = await file.read()
            file_size = len(file_content)
            
            # Determine MIME type
            mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
            
            # Upload to S3
            response = self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=mime_type,
                Metadata={
                    'tenant_id': tenant_id,
                    'document_type': document_type,
                    'original_filename': file.filename or 'unknown',
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            return {
                'filename': unique_filename,
                'original_filename': file.filename,
                'file_size': file_size,
                'mime_type': mime_type,
                's3_bucket': self.bucket_name,
                's3_key': s3_key,
                's3_etag': response['ETag'].strip('"'),
                's3_url': f"s3://{self.bucket_name}/{s3_key}"
            }
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")
    
    def upload_bytes(
        self,
        *,
        content: bytes,
        tenant_id: str,
        document_type: str,
        filename: str | None = None,
        client_id: Optional[str] = None,
        content_type: str | None = None,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Upload raw bytes to S3 and return metadata"""
        try:
            file_extension = ""
            if filename:
                file_extension = os.path.splitext(filename)[1]
            unique_filename = filename or f"{uuid.uuid4()}{file_extension}"

            s3_key = f"tenants/{tenant_id}/{document_type}/"
            if client_id:
                s3_key += f"clients/{client_id}/"
            s3_key += unique_filename

            mime_type = content_type or (mimetypes.guess_type(filename)[0] if filename else None) or "application/pdf"
            metadata = metadata or {}
            metadata.update({
                'tenant_id': tenant_id,
                'document_type': document_type,
                'uploaded_at': datetime.utcnow().isoformat()
            })

            response = self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=content,
                ContentType=mime_type,
                Metadata=metadata
            )

            return {
                'filename': unique_filename,
                'original_filename': filename or unique_filename,
                'file_size': len(content),
                'mime_type': mime_type,
                's3_bucket': self.bucket_name,
                's3_key': s3_key,
                's3_etag': response['ETag'].strip('"'),
                's3_url': f"s3://{self.bucket_name}/{s3_key}"
            }

        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        method: str = 'get_object'
    ) -> str:
        """Generate a presigned URL for file access"""
        try:
            url = self.s3_client.generate_presigned_url(
                method,
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate URL: {str(e)}")
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            print(f"Failed to delete file {s3_key}: {str(e)}")
            return False
    
    def get_file_metadata(self, s3_key: str) -> dict:
        """Get file metadata from S3"""
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return {
                'content_length': response['ContentLength'],
                'content_type': response['ContentType'],
                'last_modified': response['LastModified'],
                'etag': response['ETag'].strip('"'),
                'metadata': response.get('Metadata', {})
            }
        except ClientError as e:
            raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")
    
    def list_files(self, prefix: str, max_keys: int = 1000) -> list:
        """List files with given prefix"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            
            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'],
                    'etag': obj['ETag'].strip('"')
                })
            
            return files
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


# Global storage service instance
storage_service = S3StorageService()
