/**
 * OpenAPI Specification for API Gateway
 *
 * POC-3: Complete API documentation with Swagger UI
 *
 * This file defines the OpenAPI 3.0 specification for all API endpoints.
 * Swagger UI is served at /api-docs
 */

import { Options } from 'swagger-jsdoc';

/**
 * OpenAPI specification options for swagger-jsdoc
 */
export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MFE POC-3 API',
      description: `
## Backend API for MFE POC-3 Platform

This API Gateway provides a unified interface to all backend microservices:
- **Auth Service** - User authentication and authorization
- **Payments Service** - Payment operations (stubbed - no real PSP)
- **Admin Service** - Administrative operations
- **Profile Service** - User profile management

### Authentication
Most endpoints require JWT Bearer token authentication.
Obtain a token via \`POST /api/auth/login\`.

### Base URLs
- **Development (HTTP):** \`http://localhost:3000/api\`
- **Development (HTTPS via nginx):** \`https://localhost/api\`

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Admin endpoints: 50 requests per 15 minutes
      `,
      version: '3.0.0',
      contact: {
        name: 'Architecture Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Relative URL (uses current origin)',
      },
      {
        url: 'https://localhost',
        description: 'Development server (HTTPS via nginx)',
      },
      {
        url: 'http://localhost:3000',
        description:
          'Development server (HTTP direct - use for local testing only)',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Payments',
        description: 'Payment operations (stubbed - no real PSP integration)',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (ADMIN role required)',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/auth/login',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: { type: 'string', example: 'John Doe' },
            role: { $ref: '#/components/schemas/UserRole' },
            emailVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'CUSTOMER', 'VENDOR'],
          example: 'CUSTOMER',
        },

        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'newuser@example.com',
            },
            password: {
              type: 'string',
              minLength: 12,
              example: 'SecurePassword123!',
            },
            name: { type: 'string', example: 'John Doe' },
            role: { $ref: '#/components/schemas/UserRole' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@example.com',
            },
            password: { type: 'string', example: 'Admin123!@#' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...',
            },
          },
        },
        PasswordChangeRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', example: 'OldPassword123!' },
            newPassword: {
              type: 'string',
              minLength: 12,
              example: 'NewSecurePassword456!',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...',
                },
              },
            },
            message: { type: 'string', example: 'Login successful' },
          },
        },

        // Payment schemas
        PaymentStatus: {
          type: 'string',
          enum: [
            'pending',
            'initiated',
            'processing',
            'completed',
            'failed',
            'cancelled',
          ],
          example: 'pending',
        },
        PaymentType: {
          type: 'string',
          enum: ['initiate', 'payment'],
          example: 'payment',
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 100.0 },
            currency: { type: 'string', example: 'USD' },
            status: { $ref: '#/components/schemas/PaymentStatus' },
            type: { $ref: '#/components/schemas/PaymentType' },
            description: { type: 'string', example: 'Invoice #12345' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreatePaymentRequest: {
          type: 'object',
          required: ['amount', 'currency'],
          properties: {
            amount: { type: 'number', minimum: 0.01, example: 100.0 },
            currency: { type: 'string', example: 'USD' },
            description: { type: 'string', example: 'Invoice #12345' },
            type: { $ref: '#/components/schemas/PaymentType' },
            metadata: { type: 'object', example: { invoiceId: '12345' } },
          },
        },
        UpdatePaymentStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { $ref: '#/components/schemas/PaymentStatus' },
          },
        },

        // Profile schemas
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            avatarUrl: { type: 'string', nullable: true },
            phone: { type: 'string', example: '+1234567890' },
            address: { type: 'string', example: '123 Main St, City, Country' },
            bio: { type: 'string', example: 'Software developer' },
            preferences: { $ref: '#/components/schemas/Preferences' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Preferences: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark'], example: 'dark' },
            notifications: {
              type: 'object',
              properties: {
                email: { type: 'boolean', example: true },
                push: { type: 'boolean', example: false },
              },
            },
            language: { type: 'string', example: 'en' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            phone: { type: 'string', example: '+1987654321' },
            address: { type: 'string', example: '456 Oak Ave, Town, Country' },
            bio: { type: 'string', example: 'Full-stack developer' },
          },
        },
        UpdatePreferencesRequest: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark'] },
            notifications: {
              type: 'object',
              properties: {
                email: { type: 'boolean' },
                push: { type: 'boolean' },
              },
            },
            language: { type: 'string' },
          },
        },

        // Common schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request body' },
                details: { type: 'object' },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                timestamp: { type: 'string', format: 'date-time' },
                service: { type: 'string', example: 'api-gateway' },
                uptime: { type: 'number', example: 3600 },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1, minimum: 1 },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field',
          schema: { type: 'string', default: 'createdAt' },
        },
        OrderParam: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid request body',
                  details: { email: 'Invalid email format' },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                  details: { retryAfter: 300 },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      // Health endpoints
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Basic health check endpoint',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
      '/health/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness check',
          description: 'Indicates if service is ready to accept traffic',
          operationId: 'readinessCheck',
          responses: {
            '200': {
              description: 'Service is ready',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          ready: { type: 'boolean', example: true },
                          timestamp: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/health/live': {
        get: {
          tags: ['Health'],
          summary: 'Liveness check',
          description: 'Indicates if service is alive',
          operationId: 'livenessCheck',
          responses: {
            '200': {
              description: 'Service is alive',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          alive: { type: 'boolean', example: true },
                          timestamp: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Auth endpoints
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Create a new user account',
          operationId: 'register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: {
                      code: 'USER_EXISTS',
                      message: 'Email already registered',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'User login',
          description: 'Authenticate a user and receive JWT tokens',
          operationId: 'login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: {
                      code: 'INVALID_CREDENTIALS',
                      message: 'Invalid email or password',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'User logout',
          description: 'Logout the current user',
          operationId: 'logout',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                  example: {
                    success: true,
                    message: 'Logout successful',
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Get a new access token using refresh token',
          operationId: 'refreshToken',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          accessToken: { type: 'string' },
                        },
                      },
                      message: {
                        type: 'string',
                        example: 'Token refreshed successfully',
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          description: 'Get information about the authenticated user',
          operationId: 'getCurrentUser',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/auth/password': {
        put: {
          tags: ['Auth'],
          summary: 'Change password',
          description: 'Change the current user password',
          operationId: 'changePassword',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PasswordChangeRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password changed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      // Payments endpoints
      '/api/payments': {
        get: {
          tags: ['Payments'],
          summary: 'List payments',
          description:
            'Get a paginated list of payments. CUSTOMER sees own payments, VENDOR sees payments they initiated, ADMIN sees all.',
          operationId: 'getPayments',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            { $ref: '#/components/parameters/SortParam' },
            { $ref: '#/components/parameters/OrderParam' },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by payment status',
              schema: { $ref: '#/components/schemas/PaymentStatus' },
            },
            {
              name: 'type',
              in: 'query',
              description: 'Filter by payment type',
              schema: { $ref: '#/components/schemas/PaymentType' },
            },
          ],
          responses: {
            '200': {
              description: 'List of payments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Payment' },
                      },
                      pagination: {
                        $ref: '#/components/schemas/PaginationMeta',
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Payments'],
          summary: 'Create payment',
          description:
            'Create a new payment. Note: All payment processing is stubbed - no real PSP integration.',
          operationId: 'createPayment',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreatePaymentRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Payment created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Payment' },
                      message: {
                        type: 'string',
                        example: 'Payment created successfully',
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/payments/{id}': {
        get: {
          tags: ['Payments'],
          summary: 'Get payment by ID',
          description: 'Get a specific payment by ID',
          operationId: 'getPaymentById',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Payment ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Payment details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Payment' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        put: {
          tags: ['Payments'],
          summary: 'Update payment',
          description: 'Update a payment (VENDOR, ADMIN only)',
          operationId: 'updatePayment',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Payment ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    metadata: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Payment updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Payment' },
                      message: {
                        type: 'string',
                        example: 'Payment updated successfully',
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Payments'],
          summary: 'Cancel payment',
          description: 'Cancel a payment (VENDOR, ADMIN only)',
          operationId: 'cancelPayment',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Payment ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Payment cancelled',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/api/payments/{id}/status': {
        post: {
          tags: ['Payments'],
          summary: 'Update payment status',
          description:
            'Update the status of a payment (VENDOR, ADMIN only). Valid transitions: pending→initiated/cancelled, initiated→processing/cancelled, processing→completed/failed.',
          operationId: 'updatePaymentStatus',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Payment ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdatePaymentStatusRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Status updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': {
              description: 'Invalid status transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: {
                      code: 'PAYMENT_INVALID_STATUS',
                      message: 'Invalid status transition',
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // Admin endpoints
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all users',
          description: 'Get a paginated list of all users (ADMIN only)',
          operationId: 'getUsers',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'role',
              in: 'query',
              description: 'Filter by role',
              schema: { $ref: '#/components/schemas/UserRole' },
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search by email or name',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                      pagination: {
                        $ref: '#/components/schemas/PaginationMeta',
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        post: {
          tags: ['Admin'],
          summary: 'Create user',
          description: 'Create a new user (ADMIN only)',
          operationId: 'createUser',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                      message: {
                        type: 'string',
                        example: 'User created successfully',
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/api/admin/users/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get user by ID',
          description: 'Get a specific user by ID (ADMIN only)',
          operationId: 'getUserById',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'User details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        put: {
          tags: ['Admin'],
          summary: 'Update user',
          description: 'Update a user (ADMIN only)',
          operationId: 'updateUser',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'User updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                      message: {
                        type: 'string',
                        example: 'User updated successfully',
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Admin'],
          summary: 'Delete user',
          description: 'Delete a user (ADMIN only)',
          operationId: 'deleteUser',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'User deleted',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/api/admin/users/{id}/role': {
        put: {
          tags: ['Admin'],
          summary: 'Update user role',
          description: 'Update a user role (ADMIN only)',
          operationId: 'updateUserRole',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { $ref: '#/components/schemas/UserRole' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Role updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      '/api/admin/health': {
        get: {
          tags: ['Admin'],
          summary: 'System health',
          description: 'Get system health status (ADMIN only)',
          operationId: 'getSystemHealth',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'System health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'healthy' },
                          timestamp: { type: 'string', format: 'date-time' },
                          services: {
                            type: 'object',
                            properties: {
                              database: { type: 'string', example: 'healthy' },
                              redis: { type: 'string', example: 'healthy' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },

      // Profile endpoints
      '/api/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get profile',
          description: 'Get the current user profile',
          operationId: 'getProfile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Profile' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Update profile',
          description: 'Update the current user profile',
          operationId: 'updateProfile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Profile' },
                      message: {
                        type: 'string',
                        example: 'Profile updated successfully',
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
      '/api/profile/preferences': {
        get: {
          tags: ['Profile'],
          summary: 'Get preferences',
          description: 'Get the current user preferences',
          operationId: 'getPreferences',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User preferences',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Preferences' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Update preferences',
          description: 'Update the current user preferences',
          operationId: 'updatePreferences',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdatePreferencesRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Preferences updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Preferences' },
                      message: {
                        type: 'string',
                        example: 'Preferences updated successfully',
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },
    },
  },
  apis: [], // We define paths inline in the definition
};
