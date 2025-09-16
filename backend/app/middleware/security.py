import os
import time
from fastapi import Request, Response, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
import logging
from typing import Callable
import re

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize input data"""
    
    def __init__(self, app):
        super().__init__(app)
        
        # Dangerous patterns to block
        self.sql_injection_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
            r"(--|#|/\*|\*/)",
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            r"(\bUNION\s+SELECT\b)"
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>"
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Validate request path
        if self._contains_malicious_patterns(request.url.path):
            logger.warning(f"Blocked malicious request path: {request.url.path}")
            raise HTTPException(status_code=400, detail="Invalid request")
        
        # Validate query parameters
        for key, value in request.query_params.items():
            if self._contains_malicious_patterns(value):
                logger.warning(f"Blocked malicious query parameter: {key}={value}")
                raise HTTPException(status_code=400, detail="Invalid query parameter")
        
        return await call_next(request)

    def _contains_malicious_patterns(self, text: str) -> bool:
        """Check if text contains malicious patterns"""
        text_lower = text.lower()
        
        # Check SQL injection patterns
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        
        # Check XSS patterns
        for pattern in self.xss_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        
        return False


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """IP whitelist middleware for admin endpoints"""
    
    def __init__(self, app):
        super().__init__(app)
        
        # Admin endpoints that require IP whitelisting
        self.admin_endpoints = [
            "/api/v1/compliance/",
            "/api/v1/tenants/",
            "/admin/"
        ]
        
        # Allowed IP addresses (from environment)
        allowed_ips = os.getenv('ADMIN_ALLOWED_IPS', '').split(',')
        self.allowed_ips = [ip.strip() for ip in allowed_ips if ip.strip()]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if this is an admin endpoint
        path = request.url.path
        is_admin_endpoint = any(endpoint in path for endpoint in self.admin_endpoints)
        
        if is_admin_endpoint and self.allowed_ips:
            client_ip = request.client.host if request.client else "unknown"
            
            # Check if IP is whitelisted
            if client_ip not in self.allowed_ips:
                logger.warning(f"Blocked admin access from non-whitelisted IP: {client_ip}")
                raise HTTPException(status_code=403, detail="Access denied from this IP address")
        
        return await call_next(request)


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS attacks"""
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check Content-Length header
        content_length = request.headers.get("content-length")
        
        if content_length:
            content_length = int(content_length)
            if content_length > self.max_size:
                logger.warning(f"Blocked oversized request: {content_length} bytes")
                raise HTTPException(
                    status_code=413,
                    detail=f"Request too large. Maximum size: {self.max_size} bytes"
                )
        
        return await call_next(request)


class WebhookSecurityMiddleware(BaseHTTPMiddleware):
    """Verify webhook signatures for external integrations"""
    
    def __init__(self, app):
        super().__init__(app)
        self.webhook_secrets = {
            "stripe": os.getenv('STRIPE_WEBHOOK_SECRET'),
            "docusign": os.getenv('DOCUSIGN_WEBHOOK_SECRET')
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        # Verify Stripe webhooks
        if "/billing/webhook" in path:
            await self._verify_stripe_signature(request)
        
        # Verify DocuSign webhooks
        elif "/docusign/webhook" in path:
            await self._verify_docusign_signature(request)
        
        return await call_next(request)

    async def _verify_stripe_signature(self, request: Request):
        """Verify Stripe webhook signature"""
        signature = request.headers.get("stripe-signature")
        secret = self.webhook_secrets.get("stripe")
        
        if not signature or not secret:
            raise HTTPException(status_code=400, detail="Missing webhook signature")
        
        # Stripe signature verification would be handled in the webhook endpoint
        # This is a placeholder for additional security checks

    async def _verify_docusign_signature(self, request: Request):
        """Verify DocuSign webhook signature"""
        # DocuSign webhook verification logic
        pass


class DatabaseConnectionPoolMiddleware(BaseHTTPMiddleware):
    """Monitor and optimize database connections"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Add database connection monitoring
        start_time = time.time()
        
        response = await call_next(request)
        
        # Log database operation time
        db_time = time.time() - start_time
        if db_time > 0.5:  # Log slow database operations
            logger.warning(f"Slow database operation: {request.url.path} took {db_time:.2f}s")
        
        return response