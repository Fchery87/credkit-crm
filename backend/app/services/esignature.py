import os
import base64
from typing import Optional, Dict, Any
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class DocuSignService:
    def __init__(self):
        self.integration_key = os.getenv('DOCUSIGN_INTEGRATION_KEY')
        self.user_id = os.getenv('DOCUSIGN_USER_ID')
        self.account_id = os.getenv('DOCUSIGN_ACCOUNT_ID')
        self.private_key = os.getenv('DOCUSIGN_PRIVATE_KEY')
        self.base_path = os.getenv('DOCUSIGN_BASE_PATH', 'https://demo.docusign.net/restapi')
        
        if not all([self.integration_key, self.user_id, self.account_id, self.private_key]):
            logger.warning("DocuSign credentials not fully configured")
            self.client = None
        else:
            self.client = self._get_api_client()
    
    def _get_api_client(self) -> ApiClient:
        """Initialize DocuSign API client with JWT authentication"""
        try:
            api_client = ApiClient()
            api_client.host = self.base_path
            
            # JWT authentication
            private_key_bytes = self.private_key.encode('ascii')
            
            oauth_token = api_client.request_jwt_user_token(
                client_id=self.integration_key,
                user_id=self.user_id,
                oauth_host_name="account-d.docusign.com",  # Use account.docusign.com for production
                private_key_bytes=private_key_bytes,
                expires_in=3600
            )
            
            api_client.set_default_header("Authorization", f"Bearer {oauth_token.access_token}")
            return api_client
            
        except Exception as e:
            logger.error(f"Failed to initialize DocuSign client: {str(e)}")
            raise HTTPException(status_code=500, detail="DocuSign service unavailable")
    
    async def create_envelope(
        self,
        document_content: bytes,
        document_name: str,
        signer_email: str,
        signer_name: str,
        subject: str,
        tenant_id: str,
        client_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create and send DocuSign envelope for signature"""
        
        if not self.client:
            raise HTTPException(status_code=500, detail="DocuSign service not configured")
        
        try:
            # Encode document content
            document_base64 = base64.b64encode(document_content).decode('utf-8')
            
            # Create document
            document = Document(
                document_base64=document_base64,
                name=document_name,
                file_extension="pdf",
                document_id="1"
            )
            
            # Create signer
            signer = Signer(
                email=signer_email,
                name=signer_name,
                recipient_id="1",
                routing_order="1"
            )
            
            # Create signature tab
            sign_here = SignHere(
                document_id="1",
                page_number="1",
                recipient_id="1",
                tab_label="SignHereTab",
                x_position="100",
                y_position="100"
            )
            
            # Add tabs to signer
            signer.tabs = Tabs(sign_here_tabs=[sign_here])
            
            # Create envelope definition
            envelope_definition = EnvelopeDefinition(
                email_subject=subject,
                documents=[document],
                recipients=Recipients(signers=[signer]),
                status="sent",
                custom_fields={
                    "textCustomFields": [
                        {
                            "name": "tenant_id",
                            "value": tenant_id
                        },
                        {
                            "name": "client_id", 
                            "value": client_id or ""
                        }
                    ]
                }
            )
            
            # Send envelope
            envelopes_api = EnvelopesApi(self.client)
            results = envelopes_api.create_envelope(
                account_id=self.account_id,
                envelope_definition=envelope_definition
            )
            
            return {
                "envelope_id": results.envelope_id,
                "status": results.status,
                "status_date_time": results.status_date_time,
                "uri": results.uri
            }
            
        except Exception as e:
            logger.error(f"Failed to create DocuSign envelope: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create signature request: {str(e)}")
    
    async def get_envelope_status(self, envelope_id: str) -> Dict[str, Any]:
        """Get envelope status from DocuSign"""
        if not self.client:
            raise HTTPException(status_code=500, detail="DocuSign service not configured")
        
        try:
            envelopes_api = EnvelopesApi(self.client)
            envelope = envelopes_api.get_envelope(
                account_id=self.account_id,
                envelope_id=envelope_id
            )
            
            return {
                "envelope_id": envelope.envelope_id,
                "status": envelope.status,
                "status_date_time": envelope.status_date_time,
                "completed_date_time": envelope.completed_date_time,
                "sent_date_time": envelope.sent_date_time
            }
            
        except Exception as e:
            logger.error(f"Failed to get envelope status: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get signature status: {str(e)}")
    
    async def download_completed_document(self, envelope_id: str) -> bytes:
        """Download completed document from DocuSign"""
        if not self.client:
            raise HTTPException(status_code=500, detail="DocuSign service not configured")
        
        try:
            envelopes_api = EnvelopesApi(self.client)
            document = envelopes_api.get_document(
                account_id=self.account_id,
                envelope_id=envelope_id,
                document_id="combined"  # Gets all documents combined
            )
            
            return document
            
        except Exception as e:
            logger.error(f"Failed to download document: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to download signed document: {str(e)}")


# Global e-signature service instance
esignature_service = DocuSignService()
