import json
import time
import asyncio
from fastapi import Request, Response
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from typing import Callable, Any
import logging

from ..models.audit_log import AuditLog, AuditAction, AuditResourceType
from ..database import SessionLocal

logger = logging.getLogger(__name__)


class AuditMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Skip audit for health checks and static files
            if request.url.path in ["/api/v1/health", "/docs", "/redoc", "/openapi.json"]:
                await self.app(scope, receive, send)
                return
            
            # Capture request details
            start_time = time.time()
            request_body = None
            
            # Capture request body for audit
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.body()
                    if body:
                        request_body = body.decode('utf-8')
                except:
                    request_body = None
            
            # Process request
            response_body = None
            status_code = 200
            
            async def send_wrapper(message):
                nonlocal response_body, status_code
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                elif message["type"] == "http.response.body":
                    if message.get("body"):
                        response_body = message["body"].decode('utf-8')
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
            
            # Log the request
            processing_time = time.time() - start_time
            await self._log_request(
                request=request,
                status_code=status_code,
                processing_time=processing_time,
                request_body=request_body,
                response_body=response_body
            )
        else:
            await self.app(scope, receive, send)

    async def _log_request(
        self,
        request: Request,
        status_code: int,
        processing_time: float,
        request_body: str = None,
        response_body: str = None
    ):
        """Log request details for audit purposes"""
        try:
            # Extract user information from request
            user_id = None
            user_email = None
            user_role = None
            tenant_id = None
            
            # Try to get user from request state (set by auth middleware)
            if hasattr(request.state, 'user'):
                user = request.state.user
                user_id = str(user.id)
                user_email = user.email
                user_role = user.role
                tenant_id = str(user.tenant_id)
            
            # Determine action and resource type from path
            action, resource_type, resource_id = self._parse_request_path(
                request.method, 
                request.url.path
            )
            
            # Create audit log entry
            db = SessionLocal()
            try:
                audit_log = AuditLog(
                    tenant_id=tenant_id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    user_id=user_id,
                    user_email=user_email,
                    user_role=user_role,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                    request_method=request.method,
                    request_path=request.url.path,
                    description=f"{request.method} {request.url.path} - {status_code}",
                    event_metadata={
                        "status_code": status_code,
                        "processing_time": processing_time,
                        "query_params": dict(request.query_params),
                        "request_size": len(request_body) if request_body else 0,
                        "response_size": len(response_body) if response_body else 0
                    },
                    is_sensitive=self._is_sensitive_endpoint(request.url.path)
                )
                
                db.add(audit_log)
                db.commit()
                
            except Exception as e:
                logger.error(f"Failed to create audit log: {str(e)}")
                db.rollback()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Audit middleware error: {str(e)}")

    def _parse_request_path(self, method: str, path: str) -> tuple:
        """Parse request path to determine action and resource type"""
        # Default values
        action = AuditAction.READ if method == "GET" else AuditAction.CREATE
        resource_type = AuditResourceType.USER  # Default
        resource_id = None
        
        # Map HTTP methods to actions
        method_action_map = {
            "GET": AuditAction.READ,
            "POST": AuditAction.CREATE,
            "PUT": AuditAction.UPDATE,
            "PATCH": AuditAction.UPDATE,
            "DELETE": AuditAction.DELETE
        }
        action = method_action_map.get(method, AuditAction.READ)
        
        # Parse path to determine resource type and ID
        path_parts = path.strip('/').split('/')
        
        if len(path_parts) >= 3 and path_parts[0] == "api" and path_parts[1] == "v1":
            resource_name = path_parts[2]
            
            # Map API endpoints to resource types
            resource_map = {
                "clients": AuditResourceType.CLIENT,
                "tasks": AuditResourceType.TASK,
                "disputes": AuditResourceType.DISPUTE,
                "documents": AuditResourceType.DOCUMENT,
                "users": AuditResourceType.USER,
                "billing": AuditResourceType.SUBSCRIPTION,
                "reminders": AuditResourceType.REMINDER,
                "tags": AuditResourceType.TAG,
                "stages": AuditResourceType.STAGE,
                "automations": AuditResourceType.AUTOMATION
            }
            
            resource_type = resource_map.get(resource_name, AuditResourceType.USER)
            
            # Extract resource ID if present
            if len(path_parts) >= 4 and path_parts[3] not in ["bulk-update", "bulk-delete"]:
                resource_id = path_parts[3]
        
        # Special handling for auth endpoints
        if "auth" in path:
            if "login" in path or "token" in path:
                action = AuditAction.LOGIN
            elif "logout" in path:
                action = AuditAction.LOGOUT
        
        return action, resource_type, resource_id

    def _is_sensitive_endpoint(self, path: str) -> bool:
        """Determine if endpoint accesses sensitive data"""
        sensitive_patterns = [
            "/clients/",
            "/documents/",
            "/billing/",
            "/users/me",
            "/auth/"
        ]
        
        return any(pattern in path for pattern in sensitive_patterns)


class ComplianceLogger:
    """Specialized logger for compliance events"""
    
    @staticmethod
    async def log_data_access(
        tenant_id: str,
        user_id: str,
        resource_type: AuditResourceType,
        resource_id: str,
        fields_accessed: list,
        access_reason: str = "Business operation",
        ip_address: str = None
    ):
        """Log access to sensitive data"""
        from ..models.audit_log import DataAccessLog
        
        db = SessionLocal()
        try:
            access_log = DataAccessLog(
                tenant_id=tenant_id,
                user_id=user_id,
                resource_type=resource_type,
                resource_id=resource_id,
                fields_accessed=fields_accessed,
                access_reason=access_reason,
                ip_address=ip_address,
                is_authorized=True,
                consent_given=True  # Should be determined by business logic
            )
            
            db.add(access_log)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log data access: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    @staticmethod
    async def log_compliance_event(
        tenant_id: str,
        event_type: str,
        title: str,
        description: str,
        severity: str = "INFO",
        client_id: str = None,
        user_id: str = None,
        response_required: bool = False,
        event_data: dict = None
    ):
        """Log compliance-related events"""
        from ..models.audit_log import ComplianceEvent
        
        db = SessionLocal()
        try:
            compliance_event = ComplianceEvent(
                tenant_id=tenant_id,
                event_type=event_type,
                severity=severity,
                client_id=client_id,
                user_id=user_id,
                title=title,
                description=description,
                response_required=response_required,
                event_data=event_data or {}
            )
            
            db.add(compliance_event)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log compliance event: {str(e)}")
            db.rollback()
        finally:
            db.close()


# Decorator for automatic audit logging
def audit_action(action: AuditAction, resource_type: AuditResourceType):
    """Decorator to automatically audit function calls"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Execute the function
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # Log the action (simplified - would need more context in real implementation)
            try:
                # This would need to extract user context from the function arguments
                logger.info(f"Audited action: {action.value} on {resource_type.value}")
            except Exception as e:
                logger.error(f"Audit logging failed: {str(e)}")
            
            return result
        return wrapper
    return decorator
