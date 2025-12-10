# API Contract Documentation - POC-2

**Status:** ✅ Complete & Verified  
**Version:** 1.0  
**Date:** 2026-12-09  
**Last Verified:** 2026-12-09 (See [`api-contract-verification.md`](./api-contract-verification.md))

---

## 1. Overview

This document defines the API contracts for POC-2 backend services. It includes endpoint specifications, request/response formats, authentication requirements, and error handling.

**Services Covered:**

- Auth Service (`/api/auth/*`)
- Payments Service (`/api/payments/*`)
- Admin Service (`/api/admin/*`)
- Profile Service (`/api/profile/*`)

**Base URL:** `http://localhost:3000/api` (development)

---

## 2. API Standards

### 2.1 HTTP Methods

| Method | Purpose            | Idempotent |
| ------ | ------------------ | ---------- |
| GET    | Retrieve resources | Yes        |
| POST   | Create resources   | No         |
| PUT    | Full update        | Yes        |
| PATCH  | Partial update     | Yes        |
| DELETE | Delete resources   | Yes        |

### 2.2 Request Headers

```
Content-Type: application/json
Authorization: Bearer <access_token>  (for protected routes)
X-Request-ID: <uuid>                  (optional, for tracing)
```

### 2.3 Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 2.4 HTTP Status Codes

| Code | Description           | Usage                              |
| ---- | --------------------- | ---------------------------------- |
| 200  | OK                    | Successful GET, PUT, PATCH, DELETE |
| 201  | Created               | Successful POST                    |
| 400  | Bad Request           | Validation errors                  |
| 401  | Unauthorized          | Missing or invalid token           |
| 403  | Forbidden             | Insufficient permissions           |
| 404  | Not Found             | Resource not found                 |
| 409  | Conflict              | Resource conflict                  |
| 429  | Too Many Requests     | Rate limit exceeded                |
| 500  | Internal Server Error | Server error                       |

### 2.5 Error Codes

| Code                     | Description                       |
| ------------------------ | --------------------------------- |
| `VALIDATION_ERROR`       | Request validation failed         |
| `UNAUTHORIZED`           | Authentication required           |
| `FORBIDDEN`              | Insufficient permissions          |
| `NOT_FOUND`              | Resource not found                |
| `CONFLICT`               | Resource conflict                 |
| `RATE_LIMIT_EXCEEDED`    | Too many requests                 |
| `INTERNAL_ERROR`         | Internal server error             |
| `INVALID_CREDENTIALS`    | Invalid email or password         |
| `TOKEN_EXPIRED`          | JWT token expired                 |
| `TOKEN_INVALID`          | JWT token invalid                 |
| `USER_EXISTS`            | User already exists               |
| `PAYMENT_NOT_FOUND`      | Payment not found                 |
| `PAYMENT_INVALID_STATUS` | Invalid payment status transition |

---

## 3. Auth Service API

### 3.1 POST /api/auth/register

Register a new user.

**Authentication:** None

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "emailVerified": false,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR` - Invalid request body
- `409 USER_EXISTS` - Email already registered

---

### 3.2 POST /api/auth/login

Authenticate a user.

**Authentication:** None

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "emailVerified": true,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
  },
  "message": "Login successful"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR` - Invalid request body
- `401 INVALID_CREDENTIALS` - Invalid email or password

---

### 3.3 POST /api/auth/logout

Logout the current user.

**Authentication:** Required

**Request:** Empty body

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**

- `401 UNAUTHORIZED` - Not authenticated

---

### 3.4 POST /api/auth/refresh

Refresh the access token.

**Authentication:** None (uses refresh token)

**Request:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

**Error Responses:**

- `401 TOKEN_INVALID` - Invalid refresh token
- `401 TOKEN_EXPIRED` - Refresh token expired

---

### 3.5 GET /api/auth/me

Get current user information.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 UNAUTHORIZED` - Not authenticated

---

### 3.6 PUT /api/auth/password

Change the current user's password.

**Authentication:** Required

**Request:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR` - Invalid request body
- `401 INVALID_CREDENTIALS` - Current password incorrect

---

## 4. Payments Service API

### 4.1 GET /api/payments

Get list of payments.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Description           | Default   |
| --------- | ------ | --------------------- | --------- |
| page      | number | Page number           | 1         |
| limit     | number | Items per page        | 20        |
| sort      | string | Sort field            | createdAt |
| order     | string | Sort order (asc/desc) | desc      |
| status    | string | Filter by status      | -         |
| type      | string | Filter by type        | -         |
| startDate | string | Filter by start date  | -         |
| endDate   | string | Filter by end date    | -         |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.0,
      "currency": "USD",
      "status": "completed",
      "type": "payment",
      "description": "Invoice #12345",
      "metadata": {},
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Role-Based Access:**

- `CUSTOMER` - See own payments only
- `VENDOR` - See payments they initiated
- `ADMIN` - See all payments

---

### 4.2 GET /api/payments/:id

Get payment by ID.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.0,
    "currency": "USD",
    "status": "completed",
    "type": "payment",
    "description": "Invoice #12345",
    "metadata": {},
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:35:00.000Z",
    "transactions": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "paymentId": "660e8400-e29b-41d4-a716-446655440001",
        "transactionType": "authorization",
        "amount": 100.0,
        "status": "completed",
        "createdAt": "2026-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- `404 PAYMENT_NOT_FOUND` - Payment not found
- `403 FORBIDDEN` - Not authorized to view this payment

---

### 4.3 POST /api/payments

Create a new payment.

**Authentication:** Required

**Request:**

```json
{
  "amount": 100.0,
  "currency": "USD",
  "description": "Invoice #12345",
  "type": "payment",
  "metadata": {
    "invoiceId": "12345"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.0,
    "currency": "USD",
    "status": "pending",
    "type": "payment",
    "description": "Invoice #12345",
    "metadata": {
      "invoiceId": "12345"
    },
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  "message": "Payment created successfully"
}
```

**Role-Based Access:**

- `CUSTOMER` - Can create payments (type: "payment")
- `VENDOR` - Can initiate payments (type: "initiate")

**Note:** All payment processing is stubbed. No actual PSP integration.

---

### 4.4 PUT /api/payments/:id

Update a payment.

**Authentication:** Required

**Roles:** VENDOR, ADMIN

**Request:**

```json
{
  "description": "Updated description",
  "metadata": {
    "note": "Updated note"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.0,
    "currency": "USD",
    "status": "pending",
    "type": "payment",
    "description": "Updated description",
    "metadata": {
      "note": "Updated note"
    },
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:40:00.000Z"
  },
  "message": "Payment updated successfully"
}
```

---

### 4.5 POST /api/payments/:id/status

Update payment status.

**Authentication:** Required

**Roles:** VENDOR, ADMIN

**Request:**

```json
{
  "status": "processing"
}
```

**Valid Status Transitions:**

- `pending` → `initiated`, `cancelled`
- `initiated` → `processing`, `cancelled`
- `processing` → `completed`, `failed`
- `completed` → (terminal state)
- `failed` → (terminal state)
- `cancelled` → (terminal state)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "processing",
    "updatedAt": "2026-01-15T10:40:00.000Z"
  },
  "message": "Payment status updated"
}
```

**Error Responses:**

- `400 PAYMENT_INVALID_STATUS` - Invalid status transition

---

### 4.6 DELETE /api/payments/:id

Cancel a payment.

**Authentication:** Required

**Roles:** VENDOR, ADMIN

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Payment cancelled successfully"
}
```

**Error Responses:**

- `400 PAYMENT_INVALID_STATUS` - Cannot cancel completed/failed payment

---

### 4.7 GET /api/payments/reports

Get payment reports.

**Authentication:** Required

**Roles:** VENDOR, ADMIN

**Query Parameters:**

| Parameter | Type   | Description      | Default     |
| --------- | ------ | ---------------- | ----------- |
| startDate | string | Start date (ISO) | 30 days ago |
| endDate   | string | End date (ISO)   | now         |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalPayments": 150,
    "totalAmount": 15000.0,
    "byStatus": {
      "pending": 10,
      "initiated": 5,
      "processing": 2,
      "completed": 120,
      "failed": 8,
      "cancelled": 5
    },
    "byType": {
      "initiate": 50,
      "payment": 100
    },
    "period": {
      "start": "2026-01-01T00:00:00.000Z",
      "end": "2026-01-15T23:59:59.999Z"
    }
  }
}
```

---

## 5. Admin Service API

### 5.1 GET /api/admin/users

Get list of all users.

**Authentication:** Required

**Roles:** ADMIN

**Query Parameters:**

| Parameter | Type   | Description          | Default |
| --------- | ------ | -------------------- | ------- |
| page      | number | Page number          | 1       |
| limit     | number | Items per page       | 20      |
| role      | string | Filter by role       | -       |
| search    | string | Search by email/name | -       |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "emailVerified": true,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 5.2 GET /api/admin/users/:id

Get user by ID.

**Authentication:** Required

**Roles:** ADMIN

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z",
    "profile": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "avatarUrl": null,
      "phone": "+1234567890",
      "address": "123 Main St",
      "bio": "Software developer"
    }
  }
}
```

---

### 5.3 POST /api/admin/users

Create a new user.

**Authentication:** Required

**Roles:** ADMIN

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Doe",
  "role": "VENDOR"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "VENDOR",
    "emailVerified": false,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

---

### 5.4 PUT /api/admin/users/:id

Update a user.

**Authentication:** Required

**Roles:** ADMIN

**Request:**

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "role": "CUSTOMER",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T11:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

---

### 5.5 PUT /api/admin/users/:id/role

Update user role.

**Authentication:** Required

**Roles:** ADMIN

**Request:**

```json
{
  "role": "VENDOR"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "VENDOR",
    "updatedAt": "2026-01-15T11:00:00.000Z"
  },
  "message": "User role updated successfully"
}
```

---

### 5.6 DELETE /api/admin/users/:id

Delete a user.

**Authentication:** Required

**Roles:** ADMIN

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 5.7 GET /api/admin/audit-logs

Get audit logs.

**Authentication:** Required

**Roles:** ADMIN

**Query Parameters:**

| Parameter | Type   | Description          | Default |
| --------- | ------ | -------------------- | ------- |
| page      | number | Page number          | 1       |
| limit     | number | Items per page       | 50      |
| userId    | string | Filter by user ID    | -       |
| action    | string | Filter by action     | -       |
| startDate | string | Filter by start date | -       |
| endDate   | string | Filter by end date   | -       |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "action": "USER_LOGIN",
      "resourceType": "user",
      "resourceId": "550e8400-e29b-41d4-a716-446655440000",
      "details": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

---

### 5.8 GET /api/admin/analytics

Get system analytics.

**Authentication:** Required

**Roles:** ADMIN

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "byRole": {
        "ADMIN": 5,
        "CUSTOMER": 800,
        "VENDOR": 195
      },
      "activeLastDay": 150,
      "activeLastWeek": 500
    },
    "payments": {
      "total": 5000,
      "totalAmount": 500000.0,
      "completedLastDay": 50
    }
  }
}
```

---

### 5.9 GET /api/admin/health

Get system health status.

**Authentication:** Required

**Roles:** ADMIN

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-15T10:30:00.000Z",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "authService": "healthy",
      "paymentsService": "healthy"
    },
    "version": "1.0.0"
  }
}
```

---

## 6. Profile Service API

### 6.1 GET /api/profile

Get current user's profile.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "avatarUrl": "https://example.com/avatar.jpg",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "bio": "Software developer",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false
      },
      "language": "en"
    },
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 6.2 PUT /api/profile

Update current user's profile.

**Authentication:** Required

**Request:**

```json
{
  "phone": "+1987654321",
  "address": "456 Oak Ave, Town, Country",
  "bio": "Full-stack developer"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "avatarUrl": "https://example.com/avatar.jpg",
    "phone": "+1987654321",
    "address": "456 Oak Ave, Town, Country",
    "bio": "Full-stack developer",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false
      },
      "language": "en"
    },
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T11:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### 6.3 GET /api/profile/preferences

Get current user's preferences.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    },
    "language": "en"
  }
}
```

---

### 6.4 PUT /api/profile/preferences

Update current user's preferences.

**Authentication:** Required

**Request:**

```json
{
  "theme": "light",
  "notifications": {
    "email": false,
    "push": true
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "theme": "light",
    "notifications": {
      "email": false,
      "push": true
    },
    "language": "en"
  },
  "message": "Preferences updated successfully"
}
```

---

## 7. OpenAPI Specification Template

```yaml
openapi: 3.0.3
info:
  title: MFE POC-2 API
  description: Backend API for MFE POC-2 Platform
  version: 1.0.0
  contact:
    name: Architecture Team
servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://api.example.com/api
    description: Production server

tags:
  - name: Auth
    description: Authentication and authorization endpoints
  - name: Payments
    description: Payment operations
  - name: Admin
    description: Administrative operations
  - name: Profile
    description: User profile management

paths:
  /auth/register:
    post:
      tags: [Auth]
      summary: Register a new user
      operationId: register
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'

  /auth/login:
    post:
      tags: [Auth]
      summary: Authenticate a user
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /payments:
    get:
      tags: [Payments]
      summary: Get list of payments
      operationId: getPayments
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/PaymentStatus'
      responses:
        '200':
          description: Payments retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentsListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        emailVerified:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    UserRole:
      type: string
      enum: [ADMIN, CUSTOMER, VENDOR]

    PaymentStatus:
      type: string
      enum: [pending, initiated, processing, completed, failed, cancelled]

    PaymentType:
      type: string
      enum: [initiate, payment]

    Payment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        amount:
          type: number
        currency:
          type: string
        status:
          $ref: '#/components/schemas/PaymentStatus'
        type:
          $ref: '#/components/schemas/PaymentType'
        description:
          type: string
        metadata:
          type: object
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    RegisterRequest:
      type: object
      required: [email, password, name]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 12
        name:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'

    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string

    AuthResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            user:
              $ref: '#/components/schemas/User'
            accessToken:
              type: string
            refreshToken:
              type: string

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        default: 1
    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        default: 20

  responses:
    UnauthorizedError:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ConflictError:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    NotFoundError:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

---

## 8. Rate Limiting

### 8.1 Default Limits

| Endpoint Type   | Limit        | Window     |
| --------------- | ------------ | ---------- |
| General API     | 100 requests | 15 minutes |
| Auth endpoints  | 5 requests   | 15 minutes |
| Admin endpoints | 50 requests  | 15 minutes |

### 8.2 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### 8.3 Rate Limit Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 300
    }
  }
}
```

---

## 9. Related Documents

- `docs/POC-2-Implementation/type-sharing-strategy.md` - Type definitions
- `docs/POC-2-Implementation/environment-configuration.md` - Environment setup
- `docs/References/backend-poc2-architecture.md` - Backend architecture
- `docs/References/backend-api-documentation-standards.md` - API standards

---

**Last Updated:** 2026-12-09  
**Status:** ✅ Complete & Verified  
**Verification:** All 22 implemented endpoints verified against contracts (see [`api-contract-verification.md`](./api-contract-verification.md))
