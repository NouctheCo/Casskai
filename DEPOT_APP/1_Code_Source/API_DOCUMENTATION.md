# 📡 CassKai - Documentation API

## Table des matières
- [Introduction](#introduction)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Schemas](#schemas)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)

---

## Introduction

**Base URL**: `https://api.casskai.app/v1`

**Format**: JSON  
**Encoding**: UTF-8  
**Version**: 1.0.0

---

## Authentication

### API Key

```http
GET /api/v1/resource
Authorization: Bearer YOUR_API_KEY
```

### OAuth 2.0

```http
POST /api/v1/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Endpoints

### Invoices

#### List Invoices
```http
GET /api/v1/invoices
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (draft, sent, paid, overdue)
- `client_id` (string): Filter by client
- `date_from` (string): ISO date
- `date_to` (string): ISO date

**Response:**
```json
{
  "data": [
    {
      "id": "inv_abc123",
      "number": "FA-2025-001",
      "client": {
        "id": "cli_xyz789",
        "name": "Acme Corp",
        "email": "contact@acme.com"
      },
      "date": "2025-01-15",
      "due_date": "2025-02-15",
      "amount": 1250.00,
      "amount_paid": 0.00,
      "currency": "EUR",
      "status": "sent",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### Create Invoice
```http
POST /api/v1/invoices
Content-Type: application/json
```

**Body:**
```json
{
  "client_id": "cli_xyz789",
  "date": "2025-01-15",
  "due_date": "2025-02-15",
  "currency": "EUR",
  "lines": [
    {
      "description": "Consulting services",
      "quantity": 10,
      "unit_price": 100.00,
      "tax_rate": 20.0
    }
  ],
  "notes": "Payment terms: Net 30"
}
```

**Response:** `201 Created`
```json
{
  "id": "inv_abc123",
  "number": "FA-2025-001",
  "status": "draft",
  "total": 1200.00,
  "pdf_url": "https://api.casskai.app/invoices/inv_abc123/pdf"
}
```

#### Get Invoice
```http
GET /api/v1/invoices/{invoice_id}
```

#### Update Invoice
```http
PUT /api/v1/invoices/{invoice_id}
```

#### Delete Invoice
```http
DELETE /api/v1/invoices/{invoice_id}
```

#### Send Invoice
```http
POST /api/v1/invoices/{invoice_id}/send
```

**Body:**
```json
{
  "email": "client@example.com",
  "subject": "Invoice FA-2025-001",
  "message": "Please find attached your invoice."
}
```

---

### Clients

#### List Clients
```http
GET /api/v1/clients
```

#### Create Client
```http
POST /api/v1/clients
```

**Body:**
```json
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+33123456789",
  "address": {
    "street": "123 Main St",
    "city": "Paris",
    "postal_code": "75001",
    "country": "FR"
  },
  "tax_id": "FR12345678901"
}
```

---

### Accounting

#### Journal Entries
```http
GET /api/v1/accounting/journals
POST /api/v1/accounting/journals
```

#### Chart of Accounts
```http
GET /api/v1/accounting/accounts
```

#### Balance Sheet
```http
GET /api/v1/accounting/balance-sheet?date=2025-01-31
```

#### Income Statement
```http
GET /api/v1/accounting/income-statement?start_date=2025-01-01&end_date=2025-01-31
```

---

### Reports

#### Financial Reports
```http
GET /api/v1/reports/financial
```

**Query Parameters:**
- `type` (string): report type (balance_sheet, income_statement, cash_flow)
- `period` (string): month, quarter, year
- `start_date` (string): ISO date
- `end_date` (string): ISO date
- `format` (string): json, pdf, xlsx

**Response:**
```json
{
  "report_type": "income_statement",
  "period": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "data": {
    "revenue": 125000.00,
    "expenses": 80000.00,
    "net_income": 45000.00
  },
  "pdf_url": "https://api.casskai.app/reports/rep_abc123/pdf"
}
```

---

### E-Invoicing

#### Submit E-Invoice
```http
POST /api/v1/einvoicing/submit
```

**Body:**
```json
{
  "invoice_id": "inv_abc123",
  "format": "ubl",
  "channel": "peppol"
}
```

#### Check Status
```http
GET /api/v1/einvoicing/documents/{document_id}
```

**Response:**
```json
{
  "document_id": "doc_xyz789",
  "status": "delivered",
  "tracking": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "status": "submitted",
      "message": "Document submitted to network"
    },
    {
      "timestamp": "2025-01-15T10:35:00Z",
      "status": "delivered",
      "message": "Document delivered to recipient"
    }
  ]
}
```

---

## Schemas

### Invoice Schema
```typescript
interface Invoice {
  id: string;
  number: string;
  client: Client;
  date: string; // ISO 8601
  due_date: string;
  lines: InvoiceLine[];
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  currency: string; // ISO 4217
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: Address;
  tax_id?: string;
}

interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string; // ISO 3166-1 alpha-2
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid client_id provided",
    "details": {
      "field": "client_id",
      "reason": "Client not found"
    },
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary unavailable |

---

## Rate Limiting

**Limits:**
- 100 requests per minute (burst: 200)
- 10,000 requests per hour
- 100,000 requests per day

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

**429 Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after": 30
  }
}
```

---

## Webhooks

### Configure Webhook
```http
POST /api/v1/webhooks
```

**Body:**
```json
{
  "url": "https://your-app.com/webhooks/casskai",
  "events": [
    "invoice.created",
    "invoice.paid",
    "payment.received"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload
```json
{
  "id": "evt_abc123",
  "type": "invoice.paid",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "invoice_id": "inv_abc123",
    "amount": 1200.00,
    "payment_method": "bank_transfer"
  }
}
```

### Verify Signature
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === `sha256=${digest}`;
}
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { CassKaiAPI } from '@casskai/sdk';

const api = new CassKaiAPI({
  apiKey: process.env.CASSKAI_API_KEY
});

// Create invoice
const invoice = await api.invoices.create({
  client_id: 'cli_xyz789',
  date: '2025-01-15',
  lines: [
    {
      description: 'Consulting',
      quantity: 10,
      unit_price: 100.00,
      tax_rate: 20.0
    }
  ]
});

// Send invoice
await api.invoices.send(invoice.id, {
  email: 'client@example.com'
});
```

### Python
```python
from casskai import CassKaiAPI

api = CassKaiAPI(api_key=os.environ['CASSKAI_API_KEY'])

# Create invoice
invoice = api.invoices.create(
    client_id='cli_xyz789',
    date='2025-01-15',
    lines=[
        {
            'description': 'Consulting',
            'quantity': 10,
            'unit_price': 100.00,
            'tax_rate': 20.0
        }
    ]
)

# Send invoice
api.invoices.send(invoice.id, email='client@example.com')
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/v1/invoices?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 245,
    "pages": 5,
    "has_next": true,
    "has_previous": true
  }
}
```

---

## Filtering & Sorting

**Multiple filters:**
```http
GET /api/v1/invoices?status=sent&client_id=cli_xyz789&date_from=2025-01-01
```

**Sorting:**
```http
GET /api/v1/invoices?sort=created_at&order=desc
```

---

## Versioning

API versions are specified in the URL:
- Current: `/v1/`
- Legacy: `/v0/` (deprecated)

**Version in header:**
```http
GET /api/invoices
Accept: application/vnd.casskai.v1+json
```

---

## Support

- 📧 API Support: api@casskai.app
- 📚 Full API Reference: [api.casskai.app/docs](https://api.casskai.app/docs)
- 💬 Developer Chat: [discord.gg/casskai](https://discord.gg/casskai)

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-03  
**OpenAPI Spec**: [api.casskai.app/openapi.json](https://api.casskai.app/openapi.json)
