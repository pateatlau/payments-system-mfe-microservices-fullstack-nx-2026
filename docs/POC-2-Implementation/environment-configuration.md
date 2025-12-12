# Environment Configuration Guide - POC-2

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## 1. Overview

This document defines all environment variables, naming conventions, and configuration validation for POC-2. It covers both frontend (MFEs) and backend (microservices) configuration.

**Goals:**

- Document all required environment variables
- Establish naming conventions
- Define validation requirements
- Provide development and production configurations
- Enable consistent configuration across environments

---

## 2. Naming Conventions

### 2.1 Frontend Environment Variables

**Prefix:** `NX_` (required for Nx to expose to frontend)

**Format:** `NX_{CATEGORY}_{NAME}`

**Examples:**

- `NX_API_BASE_URL` - Base URL for API calls
- `NX_AUTH_MFE_URL` - URL for Auth MFE remote
- `NX_ENV` - Environment name

### 2.2 Backend Environment Variables

**Format:** `{CATEGORY}_{NAME}` (no prefix required)

**Examples:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_URL` - Redis connection string

### 2.3 General Rules

1. Use UPPER_SNAKE_CASE
2. Use descriptive names
3. Group by category (API, AUTH, DB, etc.)
4. Prefix secrets with their type (e.g., `JWT_SECRET`, `DB_PASSWORD`)
5. Use `_URL` suffix for URLs
6. Use `_PORT` suffix for ports

---

## 3. Frontend Environment Variables

### 3.1 Required Variables

| Variable          | Description          | Example                     | Required |
| ----------------- | -------------------- | --------------------------- | -------- |
| `NX_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` | Yes      |
| `NX_ENV`          | Environment name     | `development`               | Yes      |

### 3.2 MFE Remote URLs

| Variable              | Description             | Example                 | Required |
| --------------------- | ----------------------- | ----------------------- | -------- |
| `NX_AUTH_MFE_URL`     | Auth MFE remote URL     | `http://localhost:4201` | Yes      |
| `NX_PAYMENTS_MFE_URL` | Payments MFE remote URL | `http://localhost:4202` | Yes      |
| `NX_ADMIN_MFE_URL`    | Admin MFE remote URL    | `http://localhost:4203` | Yes      |

### 3.3 Feature Flags

| Variable                  | Description           | Example | Required |
| ------------------------- | --------------------- | ------- | -------- |
| `NX_ENABLE_DEV_TOOLS`     | Enable React DevTools | `true`  | No       |
| `NX_ENABLE_EVENT_LOGGING` | Log event bus events  | `true`  | No       |
| `NX_ENABLE_API_LOGGING`   | Log API requests      | `true`  | No       |

### 3.4 Frontend Configuration File

```typescript
// apps/shell/src/config/env.ts

/**
 * Frontend environment configuration
 */
export interface FrontendConfig {
  apiBaseUrl: string;
  env: 'development' | 'staging' | 'production';
  mfeUrls: {
    auth: string;
    payments: string;
    admin: string;
  };
  features: {
    devTools: boolean;
    eventLogging: boolean;
    apiLogging: boolean;
  };
}

/**
 * Get environment variable with validation
 */
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

/**
 * Frontend configuration
 */
export const config: FrontendConfig = {
  apiBaseUrl: getEnvVar('NX_API_BASE_URL'),
  env: getEnvVar('NX_ENV') as FrontendConfig['env'],
  mfeUrls: {
    auth: getEnvVar('NX_AUTH_MFE_URL'),
    payments: getEnvVar('NX_PAYMENTS_MFE_URL'),
    admin: getEnvVar('NX_ADMIN_MFE_URL'),
  },
  features: {
    devTools: getEnvVar('NX_ENABLE_DEV_TOOLS', false) === 'true',
    eventLogging: getEnvVar('NX_ENABLE_EVENT_LOGGING', false) === 'true',
    apiLogging: getEnvVar('NX_ENABLE_API_LOGGING', false) === 'true',
  },
};
```

### 3.5 Frontend .env Files

**Development (.env.development):**

```bash
# Environment
NX_ENV=development

# API Configuration
NX_API_BASE_URL=http://localhost:3000/api

# MFE Remote URLs
NX_AUTH_MFE_URL=http://localhost:4201
NX_PAYMENTS_MFE_URL=http://localhost:4202
NX_ADMIN_MFE_URL=http://localhost:4203

# Feature Flags
NX_ENABLE_DEV_TOOLS=true
NX_ENABLE_EVENT_LOGGING=true
NX_ENABLE_API_LOGGING=true
```

**Production (.env.production):**

```bash
# Environment
NX_ENV=production

# API Configuration
NX_API_BASE_URL=https://api.example.com/api

# MFE Remote URLs (CDN or production URLs)
NX_AUTH_MFE_URL=https://auth.example.com
NX_PAYMENTS_MFE_URL=https://payments.example.com
NX_ADMIN_MFE_URL=https://admin.example.com

# Feature Flags
NX_ENABLE_DEV_TOOLS=false
NX_ENABLE_EVENT_LOGGING=false
NX_ENABLE_API_LOGGING=false
```

---

## 4. Backend Environment Variables

### 4.1 Database Configuration

| Variable            | Description                  | Example                                    | Required |
| ------------------- | ---------------------------- | ------------------------------------------ | -------- |
| `DATABASE_URL`      | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` | Yes      |
| `DATABASE_POOL_MIN` | Min connections in pool      | `2`                                        | No       |
| `DATABASE_POOL_MAX` | Max connections in pool      | `10`                                       | No       |

### 4.2 Authentication Configuration

| Variable                   | Description                       | Example                              | Required          |
| -------------------------- | --------------------------------- | ------------------------------------ | ----------------- |
| `JWT_SECRET`               | JWT signing secret (min 32 chars) | `your-super-secret-key-min-32-chars` | Yes               |
| `JWT_ACCESS_TOKEN_EXPIRY`  | Access token expiry               | `15m`                                | No (default: 15m) |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token expiry              | `7d`                                 | No (default: 7d)  |

### 4.3 Redis Configuration

| Variable         | Description             | Example                  | Required |
| ---------------- | ----------------------- | ------------------------ | -------- |
| `REDIS_URL`      | Redis connection string | `redis://localhost:6379` | Yes      |
| `REDIS_PASSWORD` | Redis password          | `password`               | No       |

### 4.4 Service Configuration

| Variable       | Description          | Example                                       | Required               |
| -------------- | -------------------- | --------------------------------------------- | ---------------------- |
| `NODE_ENV`     | Node environment     | `development`                                 | Yes                    |
| `PORT`         | Service port         | `3000`                                        | No (varies by service) |
| `LOG_LEVEL`    | Logging level        | `info`                                        | No (default: info)     |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:4200,http://localhost:4201` | Yes                    |

### 4.5 Service Ports

| Service          | Default Port | Variable                |
| ---------------- | ------------ | ----------------------- |
| API Gateway      | 3000         | `API_GATEWAY_PORT`      |
| Auth Service     | 3001         | `AUTH_SERVICE_PORT`     |
| Payments Service | 3002         | `PAYMENTS_SERVICE_PORT` |
| Admin Service    | 3003         | `ADMIN_SERVICE_PORT`    |
| Profile Service  | 3004         | `PROFILE_SERVICE_PORT`  |

### 4.6 Backend Configuration File

```typescript
// apps/backend/api-gateway/src/config/env.ts

import { z } from 'zod';

/**
 * Environment configuration schema
 */
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),

  // CORS
  CORS_ORIGINS: z.string().transform(val => val.split(',')),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment configuration
 */
export const env = validateEnv();

/**
 * Environment configuration type
 */
export type Env = z.infer<typeof envSchema>;
```

### 4.7 Backend .env Files

**Development (.env):**

```bash
# Node Environment
NODE_ENV=development
LOG_LEVEL=debug

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PAYMENTS_SERVICE_PORT=3002
ADMIN_SERVICE_PORT=3003
PROFILE_SERVICE_PORT=3004

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mfe_poc2
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Redis (Event Hub)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203
```

**Production (.env.production):**

```bash
# Node Environment
NODE_ENV=production
LOG_LEVEL=info

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PAYMENTS_SERVICE_PORT=3002
ADMIN_SERVICE_PORT=3003
PROFILE_SERVICE_PORT=3004

# Database (PostgreSQL) - Use environment secrets
DATABASE_URL=${DATABASE_URL}
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# JWT Authentication - Use environment secrets
JWT_SECRET=${JWT_SECRET}
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Redis (Event Hub) - Use environment secrets
REDIS_URL=${REDIS_URL}
REDIS_PASSWORD=${REDIS_PASSWORD}

# CORS
CORS_ORIGINS=https://example.com,https://auth.example.com,https://payments.example.com,https://admin.example.com
```

---

## 5. Docker Configuration

### 5.1 Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16
    container_name: mfe-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mfe_poc2
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7
    container_name: mfe-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: apps/backend/api-gateway/Dockerfile
    container_name: mfe-api-gateway
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mfe_poc2
      JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
      REDIS_URL: redis://redis:6379
      CORS_ORIGINS: http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Auth Service
  auth-service:
    build:
      context: .
      dockerfile: apps/backend/auth-service/Dockerfile
    container_name: mfe-auth-service
    ports:
      - '3001:3001'
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mfe_poc2
      JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Payments Service
  payments-service:
    build:
      context: .
      dockerfile: apps/backend/payments-service/Dockerfile
    container_name: mfe-payments-service
    ports:
      - '3002:3002'
    environment:
      NODE_ENV: development
      PORT: 3002
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mfe_poc2
      JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Admin Service
  admin-service:
    build:
      context: .
      dockerfile: apps/backend/admin-service/Dockerfile
    container_name: mfe-admin-service
    ports:
      - '3003:3003'
    environment:
      NODE_ENV: development
      PORT: 3003
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mfe_poc2
      JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Profile Service
  profile-service:
    build:
      context: .
      dockerfile: apps/backend/profile-service/Dockerfile
    container_name: mfe-profile-service
    ports:
      - '3004:3004'
    environment:
      NODE_ENV: development
      PORT: 3004
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mfe_poc2
      JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

### 5.2 Docker Compose Override for Local Development

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  postgres:
    ports:
      - '5432:5432'

  redis:
    ports:
      - '6379:6379'
```

---

## 6. Configuration Validation

### 6.1 Frontend Validation

```typescript
// apps/shell/src/config/validate.ts

import { z } from 'zod';

const frontendEnvSchema = z.object({
  NX_API_BASE_URL: z.string().url(),
  NX_ENV: z.enum(['development', 'staging', 'production']),
  NX_AUTH_MFE_URL: z.string().url(),
  NX_PAYMENTS_MFE_URL: z.string().url(),
  NX_ADMIN_MFE_URL: z.string().url(),
  NX_ENABLE_DEV_TOOLS: z.string().optional(),
  NX_ENABLE_EVENT_LOGGING: z.string().optional(),
  NX_ENABLE_API_LOGGING: z.string().optional(),
});

export function validateFrontendEnv(): void {
  const result = frontendEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Frontend environment validation failed:');
    console.error(result.error.format());

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid frontend environment configuration');
    }
  }
}
```

### 6.2 Backend Validation

```typescript
// apps/backend/shared/src/config/validate.ts

import { z } from 'zod';

const backendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().regex(/^\d+$/),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().startsWith('redis://'),
  CORS_ORIGINS: z.string().min(1),
});

export function validateBackendEnv(): void {
  const result = backendEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Backend environment validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
}
```

### 6.3 Startup Validation

**Frontend (Shell App):**

```typescript
// apps/shell/src/main.tsx
import { validateFrontendEnv } from './config/validate';

// Validate environment before app starts
validateFrontendEnv();

// Rest of app initialization...
```

**Backend (API Gateway):**

```typescript
// apps/backend/api-gateway/src/main.ts
import { validateBackendEnv } from './config/validate';

// Validate environment before server starts
validateBackendEnv();

// Rest of server initialization...
```

---

## 7. Environment-Specific Configurations

### 7.1 Development

```bash
# Development Defaults
NODE_ENV=development
LOG_LEVEL=debug

# Local URLs
NX_API_BASE_URL=http://localhost:3000/api
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mfe_poc2
REDIS_URL=redis://localhost:6379

# Feature Flags
NX_ENABLE_DEV_TOOLS=true
NX_ENABLE_EVENT_LOGGING=true
NX_ENABLE_API_LOGGING=true
```

### 7.2 Staging

```bash
# Staging Defaults
NODE_ENV=staging
LOG_LEVEL=info

# Staging URLs
NX_API_BASE_URL=https://staging-api.example.com/api
DATABASE_URL=${STAGING_DATABASE_URL}
REDIS_URL=${STAGING_REDIS_URL}

# Feature Flags
NX_ENABLE_DEV_TOOLS=false
NX_ENABLE_EVENT_LOGGING=true
NX_ENABLE_API_LOGGING=true
```

### 7.3 Production

```bash
# Production Defaults
NODE_ENV=production
LOG_LEVEL=warn

# Production URLs (from secrets)
NX_API_BASE_URL=https://api.example.com/api
DATABASE_URL=${PRODUCTION_DATABASE_URL}
REDIS_URL=${PRODUCTION_REDIS_URL}

# Feature Flags
NX_ENABLE_DEV_TOOLS=false
NX_ENABLE_EVENT_LOGGING=false
NX_ENABLE_API_LOGGING=false
```

---

## 8. Secrets Management

### 8.1 Local Development

- Use `.env` files (not committed to git)
- Use `.env.example` as template (committed to git)
- Never commit real secrets

### 8.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
```

### 8.3 Production

- Use environment-specific secrets management
- Options: GitHub Secrets, AWS Secrets Manager, HashiCorp Vault
- Never hardcode secrets in code or config files

---

## 9. .env.example Template

```bash
# ===========================================
# MFE POC-2 Environment Configuration
# ===========================================
# Copy this file to .env and fill in values
# DO NOT commit .env files to version control
# ===========================================

# -----------------------------
# General
# -----------------------------
NODE_ENV=development

# -----------------------------
# Frontend Configuration
# -----------------------------

# Environment
NX_ENV=development

# API Base URL
NX_API_BASE_URL=http://localhost:3000/api

# MFE Remote URLs
NX_AUTH_MFE_URL=http://localhost:4201
NX_PAYMENTS_MFE_URL=http://localhost:4202
NX_ADMIN_MFE_URL=http://localhost:4203

# Feature Flags
NX_ENABLE_DEV_TOOLS=true
NX_ENABLE_EVENT_LOGGING=true
NX_ENABLE_API_LOGGING=true

# -----------------------------
# Backend Configuration
# -----------------------------

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PAYMENTS_SERVICE_PORT=3002
ADMIN_SERVICE_PORT=3003
PROFILE_SERVICE_PORT=3004

# Logging
LOG_LEVEL=debug

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mfe_poc2
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT Authentication
# IMPORTANT: Use a strong secret (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Redis (Event Hub)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203
```

---

## 10. Troubleshooting

### 10.1 Common Issues

**Missing Environment Variable:**

```
Error: Missing required environment variable: NX_API_BASE_URL
```

**Solution:** Add the missing variable to your `.env` file.

**Invalid URL Format:**

```
Error: Invalid environment configuration:
  DATABASE_URL: Invalid url
```

**Solution:** Ensure URLs follow proper format (e.g., `postgresql://user:pass@host:port/db`).

**JWT Secret Too Short:**

```
Error: JWT_SECRET: String must contain at least 32 character(s)
```

**Solution:** Use a longer JWT secret (minimum 32 characters).

### 10.2 Debug Configuration

```typescript
// Debug: Print all environment variables (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Configuration:');
  console.log('- NX_API_BASE_URL:', process.env.NX_API_BASE_URL);
  console.log('- NX_ENV:', process.env.NX_ENV);
  // ... etc
}
```

---

## 11. Summary

### 11.1 Quick Reference

| Category          | Prefix           | Example               |
| ----------------- | ---------------- | --------------------- |
| Frontend API      | `NX_API_`        | `NX_API_BASE_URL`     |
| Frontend MFE      | `NX_*_MFE_`      | `NX_AUTH_MFE_URL`     |
| Frontend Features | `NX_ENABLE_`     | `NX_ENABLE_DEV_TOOLS` |
| Backend Database  | `DATABASE_`      | `DATABASE_URL`        |
| Backend JWT       | `JWT_`           | `JWT_SECRET`          |
| Backend Redis     | `REDIS_`         | `REDIS_URL`           |
| Backend Service   | `*_SERVICE_PORT` | `AUTH_SERVICE_PORT`   |

### 11.2 Required Variables Checklist

**Frontend:**

- [ ] `NX_API_BASE_URL`
- [ ] `NX_ENV`
- [ ] `NX_AUTH_MFE_URL`
- [ ] `NX_PAYMENTS_MFE_URL`
- [ ] `NX_ADMIN_MFE_URL`

**Backend:**

- [ ] `NODE_ENV`
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `REDIS_URL`
- [ ] `CORS_ORIGINS`

---

## 12. Related Documents

- `docs/POC-2-Implementation/api-contracts.md` - API contract documentation
- `docs/References/backend-poc2-architecture.md` - Backend architecture
- `docs/References/mfe-poc2-architecture.md` - Frontend architecture

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative
