# CredKit CRM API Documentation

## Overview

The CredKit CRM API is a RESTful service built with FastAPI that provides comprehensive endpoints for managing credit repair operations. All endpoints require JWT authentication and support multi-tenant data isolation.

## Base URL
```
Development: http://localhost:8000
Production: https://api.credkit.com
```

## Authentication

### JWT Token Authentication
All API endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token
```http
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=yourpassword
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Core Resources

### Clients

#### List Clients
```http
GET /api/v1/clients/
```

**Query Parameters:**
- `search` (string): Search by name or email
- `stage_id` (string): Filter by pipeline stage
- `sort_by` (string): Sort field (default: created_at)
- `sort_order` (string): asc or desc (default: desc)
- `limit` (int): Number of results (default: 50, max: 1000)
- `offset` (int): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "tenant_id": "tenant-uuid",
    "stage_id": "stage-uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Client
```http
POST /api/v1/clients/
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123"
}
```

### Tasks

#### List Tasks
```http
GET /api/v1/tasks/
```

**Query Parameters:**
- `search` (string): Search task titles
- `status` (string): Filter by status (todo, in_progress, completed, cancelled)
- `priority` (string): Filter by priority (low, medium, high, urgent)
- `assigned_to` (string): Filter by assigned user ID
- `sort_by` (string): Sort field
- `sort_order` (string): asc or desc
- `limit` (int): Number of results
- `offset` (int): Pagination offset

#### Create Task
```http
POST /api/v1/tasks/
Content-Type: application/json

{
  "title": "Review credit report",
  "description": "Analyze credit report for disputable items",
  "priority": "high",
  "due_date": "2024-01-20",
  "client_id": "client-uuid",
  "assigned_to": "user-uuid"
}
```

### Disputes

#### List Disputes
```http
GET /api/v1/disputes/
```

#### Create Dispute
```http
POST /api/v1/disputes/
Content-Type: application/json

{
  "title": "Dispute late payment - Capital One",
  "client_id": "client-uuid"
}
```

## Advanced Features

### Document Management

#### Upload Document
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

file: <binary-file-data>
document_type: credit_report
client_id: client-uuid (optional)
```

#### Download Document
```http
GET /api/v1/documents/{document_id}/download
```

**Response:**
```json
{
  "download_url": "https://s3.amazonaws.com/bucket/presigned-url",
  "filename": "credit_report.pdf",
  "expires_in": 3600
}
```

### Billing & Subscriptions

#### Create Checkout Session
```http
POST /api/v1/billing/create-checkout-session
Content-Type: application/json

{
  "plan_type": "professional"
}
```

#### Get Subscription
```http
GET /api/v1/billing/subscription
```

#### Get Usage Statistics
```http
GET /api/v1/billing/usage
```

**Response:**
```json
{
  "plan_type": "professional",
  "seats_included": 5,
  "seats_used": 3,
  "letter_credits_included": 500,
  "letter_credits_used": 150,
  "letter_credits_remaining": 350,
  "current_period_end": "2024-02-15T00:00:00Z"
}
```

### Compliance & Audit

#### Get Audit Logs
```http
GET /api/v1/compliance/audit-logs
```

**Query Parameters:**
- `action` (string): Filter by action type
- `resource_type` (string): Filter by resource type
- `user_id` (string): Filter by user
- `start_date` (datetime): Start date filter
- `end_date` (datetime): End date filter

#### Export Audit Data
```http
POST /api/v1/compliance/export-audit-data
Content-Type: application/json

{
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",
  "format": "csv"
}
```

## WebSocket Real-time Updates

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=your-jwt-token');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Real-time update:', message);
};
```

### Event Types
- `task_created`: New task created
- `task_updated`: Task status/details changed
- `client_updated`: Client information changed
- `dispute_status_changed`: Dispute status updated

## Error Handling

### Standard Error Response
```json
{
  "detail": "Error description",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Unprocessable Entity (validation error)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limits

### Default Limits
- Authentication endpoints: 5 requests/minute
- Registration: 3 requests/5 minutes
- General API: 100 requests/minute
- File uploads: 10 requests/minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## Pagination

### Standard Pagination
```http
GET /api/v1/clients/?limit=20&offset=40
```

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_next": true,
    "has_prev": true
  }
}
```

## Filtering & Search

### Search Syntax
```http
# Text search
GET /api/v1/clients/?search=john

# Multiple filters
GET /api/v1/tasks/?status=pending&priority=high&assigned_to=user-id

# Date range
GET /api/v1/audit-logs/?start_date=2024-01-01&end_date=2024-01-31
```

## Bulk Operations

### Bulk Update Tasks
```http
POST /api/v1/tasks/bulk-update
Content-Type: application/json

[
  {
    "id": "task-uuid-1",
    "status": "completed"
  },
  {
    "id": "task-uuid-2",
    "priority": "high"
  }
]
```

### Bulk Delete
```http
POST /api/v1/tasks/bulk-delete
Content-Type: application/json

{
  "task_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## SDK Examples

### Python SDK Example
```python
import requests

class CredKitAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"}
    
    def get_clients(self, search=None):
        params = {"search": search} if search else {}
        response = requests.get(
            f"{self.base_url}/api/v1/clients/",
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def create_task(self, task_data):
        response = requests.post(
            f"{self.base_url}/api/v1/tasks/",
            headers=self.headers,
            json=task_data
        )
        return response.json()

# Usage
api = CredKitAPI("http://localhost:8000", "your-jwt-token")
clients = api.get_clients(search="john")
```

### JavaScript SDK Example
```javascript
class CredKitAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getClients(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/api/v1/clients/?${params}`,
      { headers: this.headers }
    );
    return response.json();
  }

  async createTask(taskData) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/tasks/`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(taskData)
      }
    );
    return response.json();
  }
}

// Usage
const api = new CredKitAPI('http://localhost:8000', 'your-jwt-token');
const clients = await api.getClients({ search: 'john' });
```

## Webhooks

### Stripe Webhooks
Configure your Stripe webhook endpoint:
```
URL: https://your-domain.com/api/v1/billing/webhook
Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated
```

### DocuSign Webhooks
Configure DocuSign Connect:
```
URL: https://your-domain.com/api/v1/docusign/webhook
Events: envelope-completed, envelope-declined, envelope-voided
```

---

For more detailed information, visit the interactive API documentation at `/docs` when running the application.