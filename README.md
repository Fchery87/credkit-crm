# CredKit CRM - SaaS Credit Repair Management System

A comprehensive CRM built for credit repair companies. It manages clients, disputes, tasks, and automates workflows with a modern, scalable architecture.

## Features

- Client management with full lifecycle from lead to completion
- Task management (Kanban, priorities, assignees, due dates)
- Dispute tracking with statuses and pipelines
- Customizable stages and automated workflows
- Real-time dashboard and live updates (WebSocket)
- Multi-tenant architecture with data isolation
- Role-based access control (Admin, Manager, User)
- Document management (S3-compatible storage) and e-signatures
- Stripe billing, Email/SMS notifications, audit logging
- Interactive API docs via Swagger/OpenAPI

## Architecture

- Frontend: Next.js 15, TypeScript, TailwindCSS, shadcn/ui
- Backend: FastAPI, SQLAlchemy 2.x, Pydantic v2
- Data: PostgreSQL (db) and Redis (cache/sessions)
- Infra: Docker + Docker Compose, GitHub Actions CI/CD

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (optional for local frontend without Docker)
- Python 3.11+ (optional for local backend without Docker)

### Setup
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd credkit_crm
   ```

2. Backend environment (create `backend/.env`)
   ```env
   # When using Docker Compose, use these service hostnames
   DATABASE_URL=postgresql://user:password@db:5432/credkit_db
   REDIS_URL=redis://redis:6379

   # Security
   SECRET_KEY=change-me
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Optional integrations (see full list below)
   FRONTEND_URL=http://localhost:3000
   ```

3. Frontend environment (edit `frontend/.env.local`)
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. Start with Docker
   ```bash
   docker-compose up --build
   ```

5. Access the app
   - Frontend: http://localhost:3000
   - API docs: http://localhost:8000/docs
   - Login: http://localhost:3000/login

6. (Optional) Seed demo data
   ```bash
   docker compose exec backend python -m app.seed_data
   ```

### Demo Credentials
```
Admin:   admin@demo.com   / admin123
Manager: manager@demo.com / manager123
Agent:   agent@demo.com   / agent123
```

## Environment Variables

### Backend (`backend/.env`)
```env
# Database (local dev outside Docker: use localhost)
DATABASE_URL=postgresql://user:password@localhost/credkit_db
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=credkit-documents
S3_ENDPOINT_URL=https://s3.amazonaws.com  # Optional for S3-compatible services

# Email/SMS
POSTMARK_SERVER_TOKEN=your-postmark-token
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+1234567890

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY=your-private-key
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi

# App
ADMIN_ALLOWED_IPS=127.0.0.1,::1
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## API Documentation

- OpenAPI UI: http://localhost:8000/docs
- Extended docs: `docs/API.md`
- Mounted routers: auth, clients, disputes, tenants, tasks, tags, stages, reminders, automations, documents, billing, compliance, ws.

## Testing

### Backend tests
Run locally:
```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx
pytest -v
```

Or with Docker:
```bash
docker compose exec backend pytest -v
```

### Frontend tests
Frontend tests are not configured yet (no `npm test` script). Consider adding Jest/Vitest or Next Test and a `test` script in `frontend/package.json`.

## Database Migrations (Alembic)

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Create a new migration (edit models first)
docker compose exec backend alembic revision --autogenerate -m "Description"
```

## Deployment

- Ensure production environment variables are set (database, Redis, secrets, integrations).
- Build images using the provided Dockerfiles under `backend/` and `frontend/`.
- Run backend with a production server (e.g., Uvicorn/Gunicorn) and configure CORS.
- Serve the Next.js production build using the `frontend/Dockerfile` runner stage.

## Security Features

- JWT-based authentication with secure token handling
- Role-based access control (RBAC) with granular permissions
- Multi-tenant data isolation
- Redis-backed session/state where applicable
