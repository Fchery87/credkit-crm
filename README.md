# CredKit CRM - SaaS Credit Repair Management System

A comprehensive, enterprise-grade CRM system designed specifically for credit repair companies. Built with modern technologies and scalable architecture to manage clients, disputes, tasks, and automate workflows.

## 🚀 Features

### Core CRM Functionality
- **Client Management**: Complete client lifecycle from lead to completion
- **Task Management**: Kanban board with priorities, assignments, and due dates
- **Dispute Tracking**: Credit bureau dispute management with status tracking
- **Pipeline Management**: Customizable stages and automated workflows
- **Real-time Dashboard**: Live KPIs, analytics, and performance metrics

### Enterprise Features
- **Multi-tenant Architecture**: Complete data isolation between organizations
- **Role-based Access Control**: Admin, Manager, and User roles with granular permissions
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Document Management**: S3-compatible storage with secure sharing
- **E-signature Integration**: DocuSign integration for contract signing

### Integrations & Services
- **Stripe Billing**: Subscription management with usage-based pricing
- **Email/SMS Notifications**: Postmark and Twilio integration
- **Audit Logging**: Comprehensive compliance and GDPR support
- **API Documentation**: Interactive OpenAPI/Swagger documentation

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL with Redis for caching
- **Infrastructure**: Docker, GitHub Actions CI/CD

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Cache/Sessions│
                    │   (Port 6379)   │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd credkit_crm
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   
   # Configure your environment variables
   # See Environment Variables section below
   ```

3. **Start with Docker**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs
   - Login: http://localhost:3000/login

### Demo Credentials
```
Admin: admin@demo.com / admin123
Manager: manager@demo.com / manager123
Agent: agent@demo.com / agent123
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
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

# Security
ADMIN_ALLOWED_IPS=127.0.0.1,::1
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/token        # Login
GET  /api/v1/auth/users/me     # Get current user
```

### Core Resources
```
# Clients
GET    /api/v1/clients/        # List clients (with filtering)
POST   /api/v1/clients/        # Create client
PUT    /api/v1/clients/{id}    # Update client
DELETE /api/v1/clients/{id}    # Delete client

# Tasks
GET    /api/v1/tasks/          # List tasks (with filtering)
POST   /api/v1/tasks/          # Create task
PUT    /api/v1/tasks/{id}      # Update task
DELETE /api/v1/tasks/{id}      # Delete task

# Disputes
GET    /api/v1/disputes/       # List disputes
POST   /api/v1/disputes/       # Create dispute
PUT    /api/v1/disputes/{id}   # Update dispute
DELETE /api/v1/disputes/{id}   # Delete dispute
```

### Advanced Features
```
# Document Management
POST   /api/v1/documents/upload           # Upload document
GET    /api/v1/documents/                 # List documents
GET    /api/v1/documents/{id}/download    # Download document
POST   /api/v1/documents/{id}/share       # Create share link

# Billing
POST   /api/v1/billing/create-checkout-session  # Create Stripe checkout
GET    /api/v1/billing/subscription              # Get subscription
GET    /api/v1/billing/usage                     # Get usage stats

# Compliance
GET    /api/v1/compliance/audit-logs      # Get audit logs
POST   /api/v1/compliance/export-audit-data  # Export audit data
POST   /api/v1/compliance/gdpr-request    # Handle GDPR requests
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm install
npm test
```

### Integration Tests
```bash
# Run full test suite
docker-compose -f docker-compose.test.yml up --build
```

## 🚀 Deployment

### Production Environment
1. **Configure production environment variables**
2. **Set up production database and Redis**
3. **Configure external services (Stripe, S3, etc.)**
4. **Deploy using Docker Compose or Kubernetes**

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migrations
```bash
# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with secure token handling
- Role-based access control (RBAC) with granular permissions
- Multi-tenant data isolation
- Session management with Redis

### Data Protection
- Encrypted document storage
- Audit logging for all operations
- GDPR compliance tools
- Input validation and sanitization

### Infrastructure Security
- Security headers middleware
- Rate limiting and DDoS protection
- IP whitelisting for admin endpoints
- Webhook signature verification

## 📊 Monitoring & Analytics

### Performance Monitoring
- Request timing and slow query detection
- Redis caching for improved performance
- Database connection pooling
- Response compression

### Business Analytics
- Client acquisition metrics
- Task completion rates
- Revenue and subscription analytics
- User activity tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write comprehensive tests
- Document API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API Documentation: http://localhost:8000/docs
- Frontend Components: Built with shadcn/ui
- Database Schema: See `/backend/app/models/`

### Getting Help
- Create an issue for bugs or feature requests
- Check the documentation for common questions
- Review the test files for usage examples

## 🎯 Roadmap

### Upcoming Features
- Advanced reporting and analytics
- Mobile application
- Third-party integrations (CRM, accounting)
- Advanced automation workflows
- Machine learning for credit analysis

---

**Built with ❤️ for the credit repair industry**
