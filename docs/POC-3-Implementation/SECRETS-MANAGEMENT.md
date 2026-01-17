# Secrets Management Guide

**POC-3 Phase 3: Secrets Management Implementation**

This guide covers the comprehensive secrets management system implemented for the payments platform, including secret rotation, environment validation, and encryption at rest.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Secrets Encryption](#secrets-encryption)
5. [JWT Secret Rotation](#jwt-secret-rotation)
6. [Environment Variable Validation](#environment-variable-validation)
7. [Audit Logging](#audit-logging)
8. [CLI Tools](#cli-tools)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The secrets management system provides:

| Feature | Description | Status |
|---------|-------------|--------|
| **JWT Secret Rotation** | Key versioning with graceful rotation | ✅ Phase 3.1 |
| **Config Validation** | Zod-based startup validation | ✅ Phase 3.2 |
| **Secrets Encryption** | AES-256-GCM encryption at rest | ✅ Phase 3.3 |
| **Audit Logging** | Track all secret access | ✅ Phase 3.3 |

### Security Goals

- **Defense in Depth**: Multiple layers of secret protection
- **Graceful Rotation**: Zero-downtime secret updates
- **Fail-Fast**: Invalid configuration caught at startup
- **Audit Trail**: Complete visibility into secret access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    @payments-system/secrets                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  SecretManager   │  │ ConfigValidator  │  │  Encryption   │ │
│  │                  │  │                  │  │    Manager    │ │
│  │ - JWT signing    │  │ - Zod schemas    │  │               │ │
│  │ - Key versioning │  │ - Fail-fast      │  │ - AES-256-GCM │ │
│  │ - Rotation       │  │ - Insecure check │  │ - Providers   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                    │         │
│           └─────────────────────┴────────────────────┘         │
│                                 │                              │
│                                 ▼                              │
│                    ┌──────────────────┐                        │
│                    │   Audit Logger   │                        │
│                    │                  │                        │
│                    │ - Secret access  │                        │
│                    │ - Rotation events│                        │
│                    │ - Decryption     │                        │
│                    └──────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies

The secrets library is already part of the monorepo:

```bash
# Import in your service
import {
  SecretManager,
  validateConfig,
  SecretsEncryptionManager
} from '@payments-system/secrets';
```

### 2. Generate Encryption Key

```bash
# Generate a new 256-bit master key
npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key
```

### 3. Encrypt Secrets

```bash
# Set the master key
export ENCRYPTION_MASTER_KEY="<your-64-char-hex-key>"

# Encrypt a database password
npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts encrypt "my-database-password"
# Output: ENC[local:YWJjZGVmZ2hpamtsbW5vcA==...]
```

### 4. Use in Configuration

```bash
# In .env file
DATABASE_PASSWORD=ENC[local:YWJjZGVmZ2hpamtsbW5vcA==...]
ENCRYPTION_MASTER_KEY=<your-key>
```

---

## Secrets Encryption

### Encryption Format

Encrypted values use the format:

```
ENC[provider:base64_ciphertext]
```

- `provider`: Encryption provider name (e.g., `local`, `aws-kms`)
- `base64_ciphertext`: Base64-encoded encrypted data

### AES-256-GCM Details

The local encryption provider uses:

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 96 bits (12 bytes) - randomly generated per encryption
- **Auth Tag**: 128 bits (16 bytes)

```typescript
// Ciphertext structure
| IV (12 bytes) | Auth Tag (16 bytes) | Encrypted Data (variable) |
```

### Usage in Code

```typescript
import {
  SecretsEncryptionManager,
  LocalEncryptionProvider,
  createEncryptionManagerFromEnv
} from '@payments-system/secrets';

// Option 1: Create from environment
const manager = createEncryptionManagerFromEnv('my-service', auditCallback);

// Option 2: Manual creation
const provider = new LocalEncryptionProvider(masterKey, 'key-v1');
const manager = new SecretsEncryptionManager({
  serviceName: 'my-service',
  enableCache: true,
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  auditCallback: (event) => console.log('Secret access:', event),
});
manager.registerProvider(provider, true);

// Encrypt
const encrypted = await manager.encrypt('my-secret');
// Returns: ENC[local:base64data...]

// Decrypt (auto-detects provider)
const decrypted = await manager.decrypt(encrypted);
// Returns: my-secret

// Decrypt object (shallow)
const config = await manager.decryptObject({
  password: 'ENC[local:...]',
  username: 'admin', // Not encrypted, returned as-is
});

// Decrypt object (deep)
const config = await manager.decryptObjectDeep({
  database: {
    password: 'ENC[local:...]',
  },
});
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ENCRYPTION_MASTER_KEY` | 64-char hex or 44-char base64 key | Yes |
| `ENCRYPTION_KEY_ID` | Key identifier for rotation | No |
| `ENCRYPTION_CACHE_ENABLED` | Enable decryption cache | No |
| `ENCRYPTION_CACHE_TTL_MS` | Cache TTL in milliseconds | No |

---

## JWT Secret Rotation

### Key Versioning

JWT tokens include a `kid` (Key ID) in the header:

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "v2"
}
```

### Environment Variables

```bash
# Legacy (single secret)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Versioned (multiple secrets)
JWT_SECRETS='[
  {"kid":"v2","secret":"new-secret","isActive":true},
  {"kid":"v1","secret":"old-secret","isActive":false,"canVerify":true}
]'
```

### Rotation Process

1. **Generate new secret**:
   ```typescript
   const newSecret = SecretManager.generateSecret({ expiresInDays: 90 });
   ```

2. **Add to environment** (JSON array format)

3. **Restart services** (picks up new secret)

4. **Wait for grace period** (old tokens expire)

5. **Remove old secret** from environment

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/admin/secrets/status` | GET | View secrets status |
| `/auth/admin/secrets/rotate` | POST | Rotate secrets |
| `/auth/admin/secrets/rotation-history` | GET | View rotation history |
| `/auth/admin/secrets/check-expiring` | POST | Check expiring secrets |

---

## Environment Variable Validation

### Zod Schemas

All services use Zod validation on startup:

```typescript
import {
  validateConfig,
  portSchema,
  postgresUrlSchema,
  LogLevelSchema
} from '@payments-system/secrets';

const configSchema = z.object({
  port: portSchema.default(3000),
  database: z.object({
    url: postgresUrlSchema.default('postgresql://localhost/mydb'),
  }),
  logLevel: LogLevelSchema.default('info'),
});

// Validates and throws on error
const config = validateConfig(configSchema, rawConfig, 'My Service');
```

### Available Schemas

| Schema | Description |
|--------|-------------|
| `portSchema` | Valid port number (1-65535) |
| `postgresUrlSchema` | PostgreSQL connection URL |
| `redisUrlSchema` | Redis connection URL |
| `rabbitmqUrlSchema` | RabbitMQ connection URL |
| `urlSchema` | Any valid URL |
| `jwtDurationSchema` | JWT duration format (15m, 7d, etc.) |
| `NodeEnvSchema` | development, production, test |
| `LogLevelSchema` | error, warn, info, debug, trace |

### Insecure Pattern Detection

In production, these patterns are blocked:

- `change-in-production`
- `change-me`
- `your-secret`
- `default-secret`
- `test-secret`
- `development-only`
- `123456`

---

## Audit Logging

### Secret Access Events

All secret operations are audited:

```typescript
interface SecretAccessEvent {
  action: 'encrypt' | 'decrypt' | 'access';
  provider: string;
  keyId?: string;
  secretName?: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  serviceName?: string;
}
```

### Setting Up Audit Callback

```typescript
const manager = new SecretsEncryptionManager({
  serviceName: 'my-service',
  auditCallback: (event) => {
    // Send to logging system
    logger.info('Secret access', { event });

    // Send to RabbitMQ for audit logs
    eventPublisher.publish('audit.events', 'secret.accessed', event);
  },
});
```

### Integration with Existing Audit System

The secret access events can be integrated with the existing RabbitMQ-based audit logging:

```typescript
import { getEventPublisher } from './events/publisher';

const auditCallback = async (event: SecretAccessEvent) => {
  const publisher = getEventPublisher();
  await publisher.publishUserEvent('secret.accessed', {
    action: event.action,
    provider: event.provider,
    secretName: event.secretName,
    success: event.success,
    serviceName: event.serviceName,
    timestamp: event.timestamp.toISOString(),
  });
};
```

---

## CLI Tools

### Generate Master Key

```bash
npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key
```

Output:
```
Generated new master encryption key (256-bit AES):

Add this to your environment:
  export ENCRYPTION_MASTER_KEY="abc123..."

Key (hex format):
abc123...
```

### Encrypt a Secret

```bash
ENCRYPTION_MASTER_KEY=<key> npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts encrypt "my-secret"
```

Output:
```
Encrypted value:
ENC[local:YWJjZGVmZ2hpamtsbW5vcA==...]
```

### Decrypt a Secret

```bash
ENCRYPTION_MASTER_KEY=<key> npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts decrypt "ENC[local:...]"
```

### Test Encryption

```bash
npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts test
```

---

## Production Deployment

### Security Checklist

- [ ] Generate unique master key for each environment
- [ ] Store master key in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rotate master key periodically (annually recommended)
- [ ] Enable audit logging for all secret access
- [ ] Use separate keys for different environments
- [ ] Never commit encrypted values with development keys to production

### Environment Setup

```bash
# Production .env
NODE_ENV=production
ENCRYPTION_MASTER_KEY=<production-key>
ENCRYPTION_KEY_ID=prod-key-2026-01

# JWT secrets (encrypted)
JWT_SECRETS='[{"kid":"prod-v1","secret":"ENC[local:...]","isActive":true}]'
```

### Key Rotation Procedure

1. **Generate new key**:
   ```bash
   npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key
   ```

2. **Re-encrypt all secrets** with new key

3. **Update environment** with new key and encrypted values

4. **Deploy** with rolling restart

5. **Verify** services start successfully

6. **Archive** old key securely

### Cloud Provider Integration

The `EncryptionProvider` interface allows integration with cloud KMS:

```typescript
interface EncryptionProvider {
  name: string;
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
  isAvailable(): boolean;
}

// AWS KMS example (to implement)
class AwsKmsProvider implements EncryptionProvider {
  name = 'aws-kms';
  // ... implementation
}
```

---

## Troubleshooting

### Common Issues

#### "Invalid master key length"

```
Error: Invalid master key length: expected 32 bytes (256 bits), got 16 bytes.
```

**Solution**: Ensure key is 64-character hex or 44-character base64.

#### "No encryption provider registered"

```
Error: No encryption provider registered
```

**Solution**: Register a provider before encrypting:
```typescript
manager.registerProvider(new LocalEncryptionProvider(key), true);
```

#### "Unknown encryption provider"

```
Error: Unknown encryption provider: aws-kms
```

**Solution**: The encrypted value uses a provider not registered. Register the correct provider or re-encrypt with local provider.

#### "Invalid ciphertext: too short"

```
Error: Invalid ciphertext: too short
```

**Solution**: The encrypted value is corrupted. Re-encrypt the original value.

#### "Configuration validation failed"

```
[Auth Service] Configuration validation failed:
  - database.url: Database URL must start with postgresql://
```

**Solution**: Fix the environment variable to match the expected format.

### Debug Mode

Enable verbose logging:

```typescript
const manager = new SecretsEncryptionManager({
  auditCallback: (event) => {
    console.log('[Secret Debug]', JSON.stringify(event, null, 2));
  },
});
```

---

## API Reference

### SecretsEncryptionManager

```typescript
class SecretsEncryptionManager {
  constructor(options: {
    serviceName?: string;
    enableCache?: boolean;
    cacheTtlMs?: number;
    auditCallback?: AuditCallback;
  })

  registerProvider(provider: EncryptionProvider, setAsDefault?: boolean): void
  getProviderNames(): string[]
  setAuditCallback(callback: AuditCallback): void

  encrypt(plaintext: string, secretName?: string): Promise<string>
  decrypt(value: string, secretName?: string): Promise<string>
  decryptObject<T>(obj: T): Promise<T>
  decryptObjectDeep<T>(obj: T): Promise<T>
  clearCache(): void
}
```

### LocalEncryptionProvider

```typescript
class LocalEncryptionProvider implements EncryptionProvider {
  constructor(masterKey: string, keyId?: string)

  name: string  // 'local'
  isAvailable(): boolean
  encrypt(plaintext: string): Promise<string>
  decrypt(ciphertext: string): Promise<string>
  getKeyId(): string
}
```

### Utility Functions

```typescript
function generateMasterKey(): string
function isEncrypted(value: string): boolean
function parseEncryptedValue(value: string): { provider: string; ciphertext: string } | null
function formatEncryptedValue(provider: string, ciphertext: string): string
function createEncryptionManagerFromEnv(serviceName: string, auditCallback?: AuditCallback): SecretsEncryptionManager | null
```

---

## Related Documentation

- [SECRETS-ROTATION-GUIDE.md](./SECRETS-ROTATION-GUIDE.md) - JWT secret rotation details
- [BACKEND-HARDENING-PLAN.md](./BACKEND-HARDENING-PLAN.md) - Overall security plan
- [@payments-system/secrets](../../libs/backend/secrets/) - Library source code
