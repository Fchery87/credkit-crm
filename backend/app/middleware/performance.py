import time
import logging
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
import redis
import json
from typing import Callable

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware for performance monitoring and optimization"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timing
        start_time = time.time()
        
        # Add performance headers
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Timestamp"] = str(int(time.time()))
        
        # Log slow requests (> 1 second)
        if process_time > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.2f}s"
            )
        
        return response


class CacheMiddleware(BaseHTTPMiddleware):
    """Redis-based caching middleware for GET requests"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client
        self.cache_ttl = 300  # 5 minutes default TTL
        
        # Cacheable endpoints
        self.cacheable_patterns = [
            "/api/v1/clients",
            "/api/v1/tasks",
            "/api/v1/disputes",
            "/api/v1/stages",
            "/api/v1/tags"
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only cache GET requests
        if request.method != "GET" or not self.redis_client:
            return await call_next(request)
        
        # Check if endpoint is cacheable
        path = request.url.path
        if not any(pattern in path for pattern in self.cacheable_patterns):
            return await call_next(request)
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        try:
            # Try to get from cache
            cached_response = self.redis_client.get(cache_key)
            if cached_response:
                logger.info(f"Cache hit for {path}")
                cached_data = json.loads(cached_response)
                
                response = Response(
                    content=cached_data["content"],
                    status_code=cached_data["status_code"],
                    headers=cached_data["headers"]
                )
                response.headers["X-Cache"] = "HIT"
                return response
        
        except Exception as e:
            logger.error(f"Cache read error: {str(e)}")
        
        # Cache miss - execute request
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            try:
                # Read response body
                response_body = b""
                async for chunk in response.body_iterator:
                    response_body += chunk
                
                # Cache the response
                cache_data = {
                    "content": response_body.decode(),
                    "status_code": response.status_code,
                    "headers": dict(response.headers)
                }
                
                self.redis_client.setex(
                    cache_key,
                    self.cache_ttl,
                    json.dumps(cache_data)
                )
                
                # Recreate response
                response = Response(
                    content=response_body,
                    status_code=response.status_code,
                    headers=response.headers
                )
                response.headers["X-Cache"] = "MISS"
                
            except Exception as e:
                logger.error(f"Cache write error: {str(e)}")
        
        return response

    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request"""
        # Include user context for tenant isolation
        user_id = getattr(request.state, 'user_id', 'anonymous')
        tenant_id = getattr(request.state, 'tenant_id', 'default')
        
        # Include query parameters
        query_string = str(request.query_params)
        
        return f"cache:{tenant_id}:{request.url.path}:{query_string}:{user_id}"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client
        
        # Rate limit configuration
        self.rate_limits = {
            "/api/v1/auth/token": {"requests": 5, "window": 60},  # 5 requests per minute
            "/api/v1/auth/register": {"requests": 3, "window": 300},  # 3 requests per 5 minutes
            "default": {"requests": 100, "window": 60}  # 100 requests per minute default
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.redis_client:
            return await call_next(request)
        
        # Get client identifier
        client_ip = request.client.host if request.client else "unknown"
        user_id = getattr(request.state, 'user_id', client_ip)
        
        # Get rate limit for endpoint
        endpoint = request.url.path
        rate_limit = self.rate_limits.get(endpoint, self.rate_limits["default"])
        
        # Generate rate limit key
        rate_key = f"rate_limit:{endpoint}:{user_id}"
        
        try:
            # Check current request count
            current_requests = self.redis_client.get(rate_key)
            
            if current_requests is None:
                # First request in window
                self.redis_client.setex(rate_key, rate_limit["window"], 1)
            else:
                current_count = int(current_requests)
                
                if current_count >= rate_limit["requests"]:
                    # Rate limit exceeded
                    logger.warning(f"Rate limit exceeded for {user_id} on {endpoint}")
                    return Response(
                        content=json.dumps({"detail": "Rate limit exceeded"}),
                        status_code=429,
                        headers={"Content-Type": "application/json"}
                    )
                else:
                    # Increment counter
                    self.redis_client.incr(rate_key)
        
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # Continue without rate limiting if Redis fails
        
        return await call_next(request)


class CompressionMiddleware(BaseHTTPMiddleware):
    """Response compression middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add compression headers for large responses
        if hasattr(response, 'body') and len(response.body) > 1024:  # > 1KB
            response.headers["Content-Encoding"] = "gzip"
        
        return response