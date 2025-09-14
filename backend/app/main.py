from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, clients, disputes, tenants

app = FastAPI(
    title="CredKit CRM API",
    description="""
    ## CredKit CRM - SaaS Credit Repair Management System

    A comprehensive CRM system designed for credit repair companies to manage clients,
    disputes, tasks, and automate workflows.

    ### Features
    - **Multi-tenant architecture** with complete data isolation
    - **Real-time updates** via WebSocket connections
    - **Advanced filtering and search** capabilities
    - **Bulk operations** for efficient data management
    - **Role-based access control** (Admin, Manager, User)
    - **Automated workflows** and reminders

    ### Authentication
    All endpoints require JWT authentication via Bearer token.
    Obtain tokens through `/api/v1/auth/token` endpoint.

    ### WebSocket
    Real-time updates available at `/api/v1/ws` endpoint.
    """,
    version="1.0.0",
    contact={
        "name": "CredKit Support",
        "email": "support@credkit.com",
    },
    license_info={
        "name": "MIT",
    },
)

# This would be configured more securely for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(disputes.router, prefix="/api/v1/disputes", tags=["disputes"])
app.include_router(tenants.router, prefix="/api/v1/tenants", tags=["tenants"])


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
