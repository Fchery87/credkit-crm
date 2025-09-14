from fastapi import APIRouter
from . import tenants, clients, disputes

api_router = APIRouter()
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(clients.router, prefix="/tenants/{tenant_id}/clients", tags=["clients"])
api_router.include_router(disputes.router, prefix="/tenants/{tenant_id}/disputes", tags=["disputes"])
