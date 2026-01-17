# Secrets Rotation Guide

**POC-3 Phase 3.1: Secrets Management**
**Created:** January 17, 2026
**Status:** Implemented

---

## Overview

This guide documents the secrets rotation policy for the MFE Payments System. It covers:
- JWT secret rotation with key versioning
- Database credential rotation procedures
- Best practices for secrets management

---

## JWT Secret Rotation

### Architecture

The system supports **key versioning** for JWT secrets, allowing graceful rotation without downtime:

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT Token Structure                       │
├─────────────────────────────────────────────────────────────┤
│  Header: { "alg": "HS256", "typ": "JWT", "kid": "v2" }     │
│  Payload: { userId, email, role, ... }                      │
│  Signature: HMAC-SHA256(header.payload, secret[kid])       │
└─────────────────────────────────────────────────────────────┘
```

- **kid** (Key ID): Identifies which secret was used to sign the token
- **Multiple secrets**: Old secrets remain active for verification during rotation
- **Graceful rotation**: New tokens use the new secret; old tokens are still valid

### Environment Variables

#### Legacy (Single Secret)

```bash
# Backwards compatible - single secret per type
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
```

#### Versioned (Multiple Secrets)

```bash
# Multiple secrets with versioning (JSON array)
JWT_SECRETS='[
  {"kid":"v2","secret":"new-secret-base64","isActive":true,"expiresAt":"2026-04-17T00:00:00Z"},
  {"kid":"v1","secret":"old-secret-base64","isActive":false,"canVerify":true}
]'

JWT_REFRESH_SECRETS='[
  {"kid":"refresh-v2","secret":"new-refresh-secret-base64","isActive":true},
  {"kid":"refresh-v1","secret":"old-refresh-secret-base64","isActive":false,"canVerify":true}
]'
```

### Rotation Process

#### 1. Pre-Rotation Checklist

- [ ] Identify all services using JWT secrets (auth-service, api-gateway)
- [ ] Schedule rotation during low-traffic window
- [ ] Notify team members
- [ ] Prepare rollback plan

#### 2. Generate New Secrets

Using the admin API:

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}' | jq -r '.data.accessToken')

# 2. Check current secrets status
curl -s -X GET https://localhost/api/auth/admin/secrets/status \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Rotate secrets
curl -s -X POST https://localhost/api/auth/admin/secrets/rotate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "both",
    "reason": "Scheduled quarterly rotation",
    "expiresInDays": 90
  }' | jq

# 4. View rotation history
curl -s -X GET https://localhost/api/auth/admin/secrets/rotation-history \
  -H "Authorization: Bearer $TOKEN" | jq
```

Or generate manually:

```bash
# Generate a cryptographically secure secret (64 bytes, base64 encoded)
openssl rand -base64 64
```

#### 3. Update Environment

For **local development**:
```bash
# Edit .env file
JWT_SECRETS='[{"kid":"v2","secret":"NEW_SECRET","isActive":true},{"kid":"v1","secret":"OLD_SECRET","isActive":false,"canVerify":true}]'
```

For **production** (using secrets manager):
1. Add new secret to AWS Secrets Manager / HashiCorp Vault
2. Update secret references in deployment configs
3. Trigger rolling deployment

#### 4. Rolling Deployment

Deploy services in this order:
1. **Auth Service** (signs new tokens with new secret)
2. **API Gateway** (verifies tokens with both secrets)
3. Other services (if they verify JWTs)

Allow 15+ minutes between deployments to ensure pods are healthy.

#### 5. Post-Rotation Cleanup

After **7+ days** (refresh token lifetime):
1. Remove old secrets from `canVerify: true`
2. Check for any lingering old tokens in logs
3. Update rotation history documentation

---

## Database Credential Rotation

### Overview

Each microservice has its own PostgreSQL database with separate credentials:

| Service | Database | Port | Default Credentials |
|---------|----------|------|---------------------|
| auth-service | auth_db | 5432 | postgres:postgres |
| payments-service | payments_db | 5433 | postgres:postgres |
| admin-service | admin_db | 5434 | postgres:postgres |
| profile-service | profile_db | 5435 | postgres:postgres |

### Rotation Process

#### 1. Pre-Rotation

- [ ] Verify backup exists
- [ ] Test connection with new credentials in staging
- [ ] Schedule during maintenance window

#### 2. Create New Database User

```sql
-- Connect to the database as superuser
psql -h localhost -p 5432 -U postgres -d auth_db

-- Create new user with same permissions
CREATE USER auth_user_v2 WITH PASSWORD 'new-secure-password';
GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user_v2;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auth_user_v2;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO auth_user_v2;

-- Test new credentials
\q
psql -h localhost -p 5432 -U auth_user_v2 -d auth_db
```

#### 3. Update Service Configuration

```bash
# Update DATABASE_URL in environment
AUTH_DATABASE_URL=postgresql://auth_user_v2:new-secure-password@localhost:5432/auth_db
```

#### 4. Rolling Deployment

Deploy auth-service with new credentials:
1. Update environment variables in secrets manager
2. Trigger rolling deployment
3. Verify connections in logs
4. Repeat for other services

#### 5. Remove Old Credentials

After **24-48 hours** with no issues:

```sql
-- Revoke privileges from old user
REVOKE ALL PRIVILEGES ON DATABASE auth_db FROM auth_user;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM auth_user;

-- Drop old user
DROP USER auth_user;
```

---

## Redis Credentials Rotation

### Current Setup

Redis is used for:
- Rate limiting (API Gateway)
- Token blacklist (Auth Service)
- Caching (All services)

### Rotation Process

1. **Add new password to Redis**:
   ```bash
   redis-cli
   CONFIG SET requirepass "new-password"
   ```

2. **Update services** with new `REDIS_URL`:
   ```bash
   REDIS_URL=redis://:new-password@localhost:6379
   ```

3. **Rolling deployment** of all services

---

## RabbitMQ Credentials Rotation

### Current Setup

RabbitMQ is used for event-driven communication between services.

| User | Password | Permissions |
|------|----------|-------------|
| admin | admin | Administrator |

### Rotation Process

1. **Create new user in RabbitMQ**:
   ```bash
   rabbitmqctl add_user new_admin new_password
   rabbitmqctl set_user_tags new_admin administrator
   rabbitmqctl set_permissions -p / new_admin ".*" ".*" ".*"
   ```

2. **Update services** with new `RABBITMQ_URL`:
   ```bash
   RABBITMQ_URL=amqp://new_admin:new_password@localhost:5672
   ```

3. **Rolling deployment** of all services

4. **Remove old user**:
   ```bash
   rabbitmqctl delete_user admin
   ```

---

## Secrets Management Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore should include:
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

### 2. Use Secrets Manager in Production

Recommended tools:
- **AWS Secrets Manager** - Native AWS integration
- **HashiCorp Vault** - Multi-cloud, robust policies
- **Azure Key Vault** - Azure integration
- **GCP Secret Manager** - GCP integration

### 3. Rotate Secrets Regularly

| Secret Type | Rotation Frequency | Grace Period |
|-------------|-------------------|--------------|
| JWT Access Secret | 90 days | 15 minutes (token lifetime) |
| JWT Refresh Secret | 90 days | 7 days (token lifetime) |
| Database Credentials | 90-180 days | 24-48 hours |
| Redis Password | 90-180 days | 1 hour |
| RabbitMQ Credentials | 90-180 days | 1 hour |

### 4. Monitor Secret Usage

Set up alerts for:
- Failed authentication attempts
- Expired token usage
- Unknown key IDs in JWT headers
- Database connection failures after rotation

### 5. Audit Trail

Maintain logs of:
- When secrets were rotated
- Who triggered the rotation
- Which services were updated
- Any issues encountered

---

## Troubleshooting

### JWT Verification Failures After Rotation

**Symptom**: 401 errors with "Token verification failed"

**Causes**:
1. Old tokens using removed secrets
2. Services not restarted after rotation
3. Mismatched secrets between services

**Solutions**:
1. Check token's `kid` header: `jwt.decode(token, { complete: true }).header.kid`
2. Verify secrets status: `GET /auth/admin/secrets/status`
3. Ensure old secrets have `canVerify: true` during grace period

### Database Connection Failures

**Symptom**: "FATAL: password authentication failed"

**Solutions**:
1. Verify new credentials work manually: `psql -U user -d database`
2. Check connection string encoding (special chars need URL encoding)
3. Verify user has correct permissions

### Service Won't Start After Rotation

**Symptom**: Service crashes with config validation error

**Cause**: Invalid secrets format or missing required secrets

**Solutions**:
1. Check JSON syntax in `JWT_SECRETS` env var
2. Ensure at least one secret has `isActive: true`
3. Review startup logs for validation errors

---

## Admin API Reference

### GET /auth/admin/secrets/status

Returns current secrets status (without actual secret values).

**Response**:
```json
{
  "success": true,
  "data": {
    "jwtSecrets": [
      {
        "kid": "v2",
        "createdAt": "2026-01-17T00:00:00Z",
        "expiresAt": "2026-04-17T00:00:00Z",
        "isActive": true,
        "canVerify": true
      }
    ],
    "refreshSecrets": [...]
  }
}
```

### POST /auth/admin/secrets/rotate

Rotates JWT secrets in memory.

**Request**:
```json
{
  "type": "both",  // "jwt", "refresh", or "both"
  "reason": "Scheduled rotation",
  "expiresInDays": 90
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Secrets rotated successfully",
    "rotated": {
      "jwt": { "kid": "key-2026-01-17-abc123" },
      "refresh": { "kid": "key-2026-01-17-def456" }
    }
  }
}
```

### GET /auth/admin/secrets/rotation-history

Returns rotation history for audit.

### POST /auth/admin/secrets/check-expiring

Checks for expiring secrets (within 30 days).

---

## Appendix: Secret Generation Commands

```bash
# Generate a 256-bit (32 bytes) secret for JWT
openssl rand -base64 32

# Generate a 512-bit (64 bytes) secret for enhanced security
openssl rand -base64 64

# Generate a UUID-based key ID
uuidgen | tr '[:upper:]' '[:lower:]'

# Generate full JWT_SECRETS env var value
cat << 'EOF'
[{"kid":"v1","secret":"$(openssl rand -base64 64)","isActive":true,"canVerify":true}]
EOF
```

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
