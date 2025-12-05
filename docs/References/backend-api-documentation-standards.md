# Backend API Documentation Standards

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** API Documentation Standards for Backend REST API

---

## Executive Summary

This document defines the API documentation standards for the backend REST API. It covers OpenAPI/Swagger specification, API versioning, endpoint naming conventions, request/response formats, error handling, and documentation best practices.

**Documentation Principles:**

- ✅ **OpenAPI Specification** - Standard API documentation format
- ✅ **Auto-Generated Docs** - Generate documentation from code
- ✅ **Interactive Docs** - Swagger UI for testing
- ✅ **Type Generation** - Generate TypeScript types from OpenAPI spec
- ✅ **Version Control** - API versioning strategy
- ✅ **Consistency** - Consistent API design across all services

---

## 1. OpenAPI/Swagger Specification

### 1.1 Purpose

OpenAPI (formerly Swagger) is the industry standard for REST API documentation. It provides:

- Machine-readable API specification
- Interactive API documentation (Swagger UI)
- Type generation (TypeScript, etc.)
- API testing
- Code generation

### 1.2 Tools

- **Swagger/OpenAPI 3.x** - API specification format
- **swagger-jsdoc** - Generate OpenAPI from JSDoc comments
- **swagger-ui-express** - Serve Swagger UI
- **openapi-typescript** - Generate TypeScript types from OpenAPI spec

### 1.3 Specification Structure

```yaml
openapi: 3.0.0
info:
  title: Backend API
  version: 1.0.0
  description: Backend REST API for MFE Platform
servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://api.example.com/api
    description: Production server
paths:
  /auth/login:
    post:
      summary: User login
      tags:
        - Auth
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
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 12
    LoginResponse:
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
```

---

## 2. API Versioning

### 2.1 Strategy

**URL-Based Versioning:**

- Current: `/api/...` (implicit v1)
- Future: `/api/v1/...`, `/api/v2/...`

**Rationale:**

- Simple and clear
- Easy to implement
- Industry standard
- Works well with OpenAPI

### 2.2 Versioning Rules

- **Breaking changes** → New version (v2)
- **Non-breaking changes** → Same version (v1)
- **Deprecation** → Announce deprecation, remove in next major version

---

## 3. Endpoint Naming Conventions

### 3.1 RESTful Conventions

**Resources:**

- Use nouns (not verbs)
- Use plural nouns
- Use lowercase with hyphens

**Examples:**

- ✅ `/api/users` (not `/api/getUsers`)
- ✅ `/api/payments` (not `/api/payment`)
- ✅ `/api/auth/login` (exception for auth actions)

### 3.2 HTTP Methods

- **GET** - Retrieve resources
- **POST** - Create resources
- **PUT** - Update resources (full update)
- **PATCH** - Update resources (partial update)
- **DELETE** - Delete resources

### 3.3 Endpoint Patterns

```
GET    /api/resource           - List resources
GET    /api/resource/:id       - Get resource by ID
POST   /api/resource           - Create resource
PUT    /api/resource/:id       - Update resource (full)
PATCH  /api/resource/:id       - Update resource (partial)
DELETE /api/resource/:id       - Delete resource
```

**Special Actions:**

```
POST   /api/resource/:id/action - Perform action on resource
GET    /api/resource/:id/status - Get resource status
```

---

## 4. Request/Response Formats

### 4.1 Request Format

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <uuid> (optional, for tracking)
```

**Body:**

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### 4.2 Response Format

**Success Response:**

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful" // Optional
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      // Additional error details
    }
  }
}
```

### 4.3 Pagination

**Request:**

```
GET /api/payments?page=1&limit=20&sort=created_at&order=desc
```

**Response:**

```json
{
  "success": true,
  "data": [
    // Array of resources
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

## 5. Error Handling

### 5.1 HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (resource conflict)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

### 5.2 Error Codes

**Format:** `SERVICE_ERROR_TYPE`

**Examples:**

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `PAYMENTS_INVALID_AMOUNT`
- `PAYMENTS_PAYMENT_NOT_FOUND`
- `ADMIN_USER_NOT_FOUND`
- `VALIDATION_EMAIL_INVALID`

### 5.3 Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "field": "email",
      "reason": "User not found"
    }
  }
}
```

---

## 6. Authentication Documentation

### 6.1 Authentication Methods

**JWT Bearer Token:**

```
Authorization: Bearer <access_token>
```

### 6.2 Authentication Flow

1. User logs in via `POST /api/auth/login`
2. Receives `accessToken` and `refreshToken`
3. Includes `accessToken` in `Authorization` header for protected routes
4. When `accessToken` expires, use `refreshToken` via `POST /api/auth/refresh`

### 6.3 Protected Routes

All routes except `/api/auth/register` and `/api/auth/login` require authentication.

---

## 7. Rate Limiting Documentation

### 7.1 Rate Limits

- **General API:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **Admin endpoints:** 50 requests per 15 minutes per IP

### 7.2 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### 7.3 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## 8. API Documentation Examples

### 8.1 Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "CUSTOMER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Response (401):**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### 8.2 Create Payment Endpoint

**Endpoint:** `POST /api/payments`

**Authentication:** Required (Bearer token)

**Authorization:** VENDOR or CUSTOMER role

**Request:**

```json
{
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for invoice #123",
  "type": "initiate"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 100.00,
    "currency": "USD",
    "status": "initiated",
    "type": "initiate",
    "description": "Payment for invoice #123",
    "created_at": "2026-01-XXT00:00:00Z"
  }
}
```

**Response (403):**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

## 9. Documentation Generation

### 9.1 JSDoc Comments

**Document endpoints with JSDoc:**

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 12
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.post('/login', authController.login);
```

### 9.2 Generate OpenAPI Spec

```typescript
// packages/api-gateway/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 9.3 Generate TypeScript Types

```bash
# Generate TypeScript types from OpenAPI spec
npx openapi-typescript openapi.json -o src/types/api.ts
```

---

## 10. Documentation Best Practices

### 10.1 Documentation Requirements

- ✅ **All endpoints documented** - Every endpoint must have OpenAPI documentation
- ✅ **Request/response examples** - Include example requests and responses
- ✅ **Error responses** - Document all possible error responses
- ✅ **Authentication** - Document authentication requirements
- ✅ **Authorization** - Document role-based access requirements
- ✅ **Rate limiting** - Document rate limits
- ✅ **Validation rules** - Document input validation rules

### 10.2 Documentation Maintenance

- ✅ **Keep docs updated** - Update docs when API changes
- ✅ **Version control** - Keep docs in version control
- ✅ **Review process** - Review docs in code reviews
- ✅ **Auto-generation** - Generate docs from code when possible

---

## 11. API Documentation Tools

### 11.1 Swagger UI

**Purpose:** Interactive API documentation

**Features:**

- Browse all endpoints
- Test endpoints directly
- View request/response schemas
- Authentication support

**Access:** `http://localhost:3000/api-docs`

### 11.2 Postman Collection

**Purpose:** API testing and documentation

**Features:**

- Import OpenAPI spec
- Test endpoints
- Share collections
- Environment variables

---

## 12. Related Documents

- `docs/backend-poc2-architecture.md` - POC-2 architecture (includes API design)
- `docs/backend-poc2-tech-stack.md` - POC-2 tech stack (includes Swagger/OpenAPI)
- `docs/backend-testing-strategy.md` - Testing strategy (includes API testing)
- `docs/security-strategy-banking.md` - Security strategy (includes API security)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for POC-2 Implementation

