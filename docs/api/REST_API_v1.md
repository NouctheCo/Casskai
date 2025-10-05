# 🔌 CassKai REST API v1.0

## API Documentation for Enterprise Plan

**Base URL**: `https://api.casskai.app/v1`
**Authentication**: API Key (Header: `X-API-Key`)
**Rate Limiting**: 1,000 requests/hour

---

## 📚 Table of Contents

1. [Authentication](#authentication)
2. [Invoices](#invoices)
3. [Clients](#clients)
4. [Payments](#payments)
5. [Journal Entries](#journal-entries)
6. [Reports](#reports)
7. [Webhooks](#webhooks)
8. [Error Handling](#error-handling)

---

## 🔐 Authentication

All API requests require an API key in the header:

```http
GET /v1/invoices
Host: api.casskai.app
X-API-Key: sk_live_1234567890abcdef
Content-Type: application/json
```

### Get API Key

1. Go to **Settings** → **API Keys** (Enterprise plan only)
2. Click **"Generate New API Key"**
3. Copy the key (shown only once!)
4. Store securely (never commit to Git)

### API Key Format

```
sk_live_xxxxxxxxxxxx  (Production)
sk_test_xxxxxxxxxxxx  (Testing/Sandbox)
```

---

## 💰 Invoices

### List Invoices

```http
GET /v1/invoices
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page (max: 100) |
| `status` | string | - | Filter by status: `draft`, `sent`, `paid`, `overdue` |
| `client_id` | uuid | - | Filter by client |
| `from_date` | date | - | ISO 8601 date (YYYY-MM-DD) |
| `to_date` | date | - | ISO 8601 date |

**Example Request:**

```bash
curl -X GET "https://api.casskai.app/v1/invoices?status=paid&limit=10" \
  -H "X-API-Key: sk_live_xxxxx"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "FA-2025-001",
      "client_id": "client-uuid",
      "client_name": "Entreprise ABC",
      "invoice_date": "2025-01-15",
      "due_date": "2025-02-15",
      "status": "paid",
      "currency": "XOF",
      "subtotal_amount": 1000000,
      "tax_amount": 180000,
      "total_amount": 1180000,
      "paid_amount": 1180000,
      "items": [
        {
          "description": "Consulting Services",
          "quantity": 10,
          "unit_price": 100000,
          "tax_rate": 18,
          "total": 1180000
        }
      ],
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T15:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "total_pages": 16
  }
}
```

### Get Invoice by ID

```http
GET /v1/invoices/{invoice_id}
```

**Example:**

```bash
curl -X GET "https://api.casskai.app/v1/invoices/550e8400-e29b-41d4-a716-446655440000" \
  -H "X-API-Key: sk_live_xxxxx"
```

### Create Invoice

```http
POST /v1/invoices
```

**Request Body:**

```json
{
  "client_id": "client-uuid",
  "invoice_date": "2025-01-15",
  "due_date": "2025-02-15",
  "currency": "XOF",
  "items": [
    {
      "description": "Web Development",
      "quantity": 40,
      "unit_price": 25000,
      "tax_rate": 18
    }
  ],
  "notes": "Payment terms: 30 days net",
  "payment_terms": "30_days"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "new-invoice-uuid",
    "invoice_number": "FA-2025-157",
    "status": "draft",
    ...
  }
}
```

### Update Invoice

```http
PATCH /v1/invoices/{invoice_id}
```

**Request Body (partial):**

```json
{
  "status": "sent",
  "notes": "Updated payment terms"
}
```

### Delete Invoice

```http
DELETE /v1/invoices/{invoice_id}
```

**Response (204 No Content)**

---

## 👥 Clients

### List Clients

```http
GET /v1/clients
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |
| `search` | string | - | Search by name, email, SIRET |
| `type` | string | - | `individual` or `company` |

**Example:**

```bash
curl -X GET "https://api.casskai.app/v1/clients?search=ABC&limit=20" \
  -H "X-API-Key: sk_live_xxxxx"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "client-uuid",
      "name": "Entreprise ABC",
      "type": "company",
      "siret": "12345678901234",
      "email": "contact@abc.com",
      "phone": "+221 77 123 45 67",
      "address": {
        "street": "123 Avenue de la République",
        "city": "Dakar",
        "postal_code": "12000",
        "country": "SN"
      },
      "payment_terms": "30_days",
      "currency": "XOF",
      "created_at": "2024-06-10T08:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Create Client

```http
POST /v1/clients
```

**Request Body:**

```json
{
  "name": "Nouvelle Entreprise",
  "type": "company",
  "siret": "98765432109876",
  "email": "contact@nouvelle.com",
  "phone": "+221 77 999 88 77",
  "address": {
    "street": "456 Rue du Commerce",
    "city": "Dakar",
    "postal_code": "12000",
    "country": "SN"
  },
  "payment_terms": "45_days",
  "currency": "XOF"
}
```

---

## 💳 Payments

### Record Payment

```http
POST /v1/payments
```

**Request Body:**

```json
{
  "invoice_id": "invoice-uuid",
  "amount": 1180000,
  "payment_date": "2025-01-20",
  "payment_method": "bank_transfer",
  "reference": "VIREMENT-20250120-001",
  "notes": "Payment received via bank transfer"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "invoice_id": "invoice-uuid",
    "amount": 1180000,
    "status": "completed",
    "created_at": "2025-01-20T16:30:00Z"
  }
}
```

### List Payments

```http
GET /v1/payments?invoice_id={invoice_id}
```

---

## 📊 Journal Entries

### Create Journal Entry

```http
POST /v1/journal-entries
```

**Request Body:**

```json
{
  "entry_date": "2025-01-15",
  "entry_type": "manual",
  "description": "Achat de matériel informatique",
  "lines": [
    {
      "account_number": "2183",
      "account_name": "Matériel informatique",
      "debit_amount": 500000,
      "credit_amount": 0
    },
    {
      "account_number": "44566",
      "account_name": "TVA déductible",
      "debit_amount": 90000,
      "credit_amount": 0
    },
    {
      "account_number": "512",
      "account_name": "Banque",
      "debit_amount": 0,
      "credit_amount": 590000
    }
  ]
}
```

**Validation Rules:**
- ✅ Debit sum must equal credit sum (accounting balance)
- ✅ At least 2 lines required
- ✅ Valid account numbers from chart of accounts

---

## 📈 Reports

### Get Balance Sheet

```http
GET /v1/reports/balance-sheet
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | date | Yes | As of date (YYYY-MM-DD) |
| `format` | string | No | `json` (default) or `pdf` |

**Example:**

```bash
curl -X GET "https://api.casskai.app/v1/reports/balance-sheet?date=2025-01-31" \
  -H "X-API-Key: sk_live_xxxxx"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "company_name": "Ma Société SARL",
    "report_date": "2025-01-31",
    "currency": "XOF",
    "assets": {
      "current_assets": {
        "cash": 5000000,
        "accounts_receivable": 3000000,
        "inventory": 2000000,
        "total": 10000000
      },
      "fixed_assets": {
        "equipment": 8000000,
        "buildings": 20000000,
        "depreciation": -5000000,
        "total": 23000000
      },
      "total_assets": 33000000
    },
    "liabilities": {
      "current_liabilities": {
        "accounts_payable": 2000000,
        "short_term_debt": 1000000,
        "total": 3000000
      },
      "long_term_liabilities": {
        "long_term_debt": 10000000,
        "total": 10000000
      },
      "equity": {
        "capital": 15000000,
        "retained_earnings": 5000000,
        "total": 20000000
      },
      "total_liabilities_equity": 33000000
    }
  }
}
```

### Get Profit & Loss

```http
GET /v1/reports/profit-loss
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | date | Yes | Period start (YYYY-MM-DD) |
| `end_date` | date | Yes | Period end (YYYY-MM-DD) |
| `format` | string | No | `json` or `pdf` |

---

## 🔔 Webhooks

### Register Webhook

```http
POST /v1/webhooks
```

**Request Body:**

```json
{
  "url": "https://your-app.com/webhooks/casskai",
  "events": [
    "invoice.created",
    "invoice.paid",
    "payment.received"
  ],
  "secret": "your-webhook-secret-for-hmac"
}
```

**Available Events:**

- `invoice.created`
- `invoice.updated`
- `invoice.sent`
- `invoice.paid`
- `invoice.overdue`
- `payment.received`
- `payment.failed`
- `client.created`
- `client.updated`

### Webhook Payload Example

When an event occurs, CassKai sends a POST request:

```http
POST /webhooks/casskai
Host: your-app.com
Content-Type: application/json
X-Casskai-Signature: sha256=abc123...
X-Casskai-Event: invoice.paid

{
  "event": "invoice.paid",
  "timestamp": "2025-01-20T16:30:00Z",
  "data": {
    "invoice_id": "invoice-uuid",
    "invoice_number": "FA-2025-001",
    "amount": 1180000,
    "currency": "XOF",
    "client": {
      "id": "client-uuid",
      "name": "Entreprise ABC"
    }
  }
}
```

**Verify Signature:**

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## ❌ Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Deletion successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid invoice data",
    "details": [
      {
        "field": "due_date",
        "message": "Due date must be after invoice date"
      }
    ]
  }
}
```

### Common Error Codes

- `INVALID_API_KEY` - API key is invalid or expired
- `RATE_LIMIT_EXCEEDED` - Too many requests (wait 1 hour)
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `INSUFFICIENT_PERMISSIONS` - API key lacks required scopes
- `DUPLICATE_ENTRY` - Resource already exists
- `ACCOUNTING_ERROR` - Journal entry not balanced

---

## 📊 Rate Limiting

**Limits by Plan:**

| Plan | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Enterprise | 1,000 | 10,000 |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1641042600
```

When exceeded (HTTP 429):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 3600 seconds",
    "retry_after": 3600
  }
}
```

---

## 🔧 Best Practices

### 1. Use Idempotency Keys

For POST/PATCH requests, use idempotency keys to prevent duplicates:

```http
POST /v1/invoices
X-API-Key: sk_live_xxxxx
X-Idempotency-Key: unique-request-id-123
```

### 2. Handle Webhooks Asynchronously

```javascript
app.post('/webhooks/casskai', (req, res) => {
  // Respond immediately
  res.status(200).send('OK');

  // Process webhook asynchronously
  processWebhook(req.body);
});
```

### 3. Implement Exponential Backoff

```python
import time

def call_api_with_retry(url, max_retries=3):
    for i in range(max_retries):
        response = requests.get(url, headers={...})
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            time.sleep(2 ** i)  # 1s, 2s, 4s
        else:
            break
    raise Exception("API call failed")
```

### 4. Store API Keys Securely

```bash
# Use environment variables
export CASSKAI_API_KEY="sk_live_xxxxx"

# Never commit to Git!
echo "CASSKAI_API_KEY" >> .gitignore
```

---

## 📞 Support

- **Documentation**: https://docs.casskai.app/api
- **API Status**: https://status.casskai.app
- **Email**: api-support@casskai.app
- **Response Time**: <24h (Enterprise plan)

---

## 🔄 API Versioning

**Current Version**: v1.0

**Deprecation Policy**:
- Breaking changes announced 6 months in advance
- Old versions supported for 12 months after deprecation
- Changelogs published at https://docs.casskai.app/api/changelog

---

## 📝 Changelog

### v1.0.0 (2025-01-15)
- ✨ Initial API release
- Endpoints: Invoices, Clients, Payments, Journal Entries, Reports
- Webhooks support
- Rate limiting implemented

---

*Last updated: 5 October 2025*
*API Version: 1.0.0*
