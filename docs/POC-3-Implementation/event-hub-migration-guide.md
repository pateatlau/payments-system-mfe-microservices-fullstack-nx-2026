# Event Hub Migration Guide - POC-3

**Status:** Template (To be completed during Phase 3)  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Step-by-step guide for migrating from Redis Pub/Sub to RabbitMQ

---

## Pre-Migration Checklist

### Prerequisites

- [ ] RabbitMQ running and accessible
- [ ] RabbitMQ management UI accessible (http://localhost:15672)
- [ ] RabbitMQ topology configured (exchanges, queues, bindings)
- [ ] `libs/backend/rabbitmq-event-hub` library created and tested
- [ ] All services updated with RabbitMQ configuration

### Environment Setup

- [ ] `RABBITMQ_URL` configured
- [ ] `RABBITMQ_USER` configured
- [ ] `RABBITMQ_PASSWORD` configured
- [ ] RabbitMQ definitions imported

---

## Migration Steps

### Step 1: Verify RabbitMQ Setup

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Access management UI
open http://localhost:15672
# Login: admin / admin (or configured credentials)
```

**Verification:**

- [ ] RabbitMQ container running
- [ ] Management UI accessible
- [ ] `events` exchange created
- [ ] `events.dlx` exchange created
- [ ] Service queues created
- [ ] Bindings configured

---

### Step 2: Test RabbitMQ Library

```bash
# Run RabbitMQ event hub tests
pnpm test libs/backend/rabbitmq-event-hub
```

**Verification:**

- [ ] Publisher tests pass
- [ ] Subscriber tests pass
- [ ] Connection management tests pass
- [ ] DLQ routing tests pass
- [ ] Test coverage > 70%

---

### Step 3: Deploy Dual Publishing

Update services to publish to both Redis and RabbitMQ:

```typescript
// Temporary dual publishing configuration
const useRabbitMQ = process.env.USE_RABBITMQ === 'true';
const useDualPublishing = process.env.DUAL_PUBLISH === 'true';
```

**Verification:**

- [ ] Services configured for dual publishing
- [ ] Events appear in both Redis and RabbitMQ
- [ ] No publishing errors

---

### Step 4: Monitor RabbitMQ Message Flow

Check messages are being published correctly:

- [ ] Check `events` exchange message rate
- [ ] Check queue depths (should be 0 if consumers active)
- [ ] Check DLQ (should be empty)

---

### Step 5: Switch Consumers to RabbitMQ

Update services to consume from RabbitMQ:

```typescript
// Switch consumer to RabbitMQ
const useRabbitMQConsumer = process.env.USE_RABBITMQ_CONSUMER === 'true';
```

**Service by Service Migration:**

1. **Profile Service** (lowest risk)
   - [ ] Switch consumer to RabbitMQ
   - [ ] Verify events received
   - [ ] Verify processing works
   - [ ] Monitor for 1 hour

2. **Admin Service** (medium risk)
   - [ ] Switch consumer to RabbitMQ
   - [ ] Verify audit events received
   - [ ] Verify processing works
   - [ ] Monitor for 1 hour

3. **Payments Service** (higher risk)
   - [ ] Switch consumer to RabbitMQ
   - [ ] Verify payment events received
   - [ ] Verify processing works
   - [ ] Monitor for 1 hour

4. **Auth Service**
   - [ ] Switch consumer to RabbitMQ
   - [ ] Verify auth events received
   - [ ] Monitor for 1 hour

---

### Step 6: Disable Redis Publishing

Once all consumers are on RabbitMQ:

```typescript
// Disable dual publishing
const useDualPublishing = false;
```

**Verification:**

- [ ] Services only publish to RabbitMQ
- [ ] No Redis Pub/Sub traffic
- [ ] All events still delivered

---

### Step 7: Run Integration Tests

```bash
# Run event-related integration tests
pnpm test:integration --grep "event"
```

**Verification:**

- [ ] All event tests pass
- [ ] Message delivery verified
- [ ] DLQ handling verified
- [ ] Retry mechanism verified

---

### Step 8: Stress Testing

```bash
# Run load test for event hub
npx ts-node scripts/stress-test-events.ts
```

**Verification:**

- [ ] 1000 messages/second throughput
- [ ] < 100ms average latency
- [ ] No message loss
- [ ] DLQ handles failures correctly

---

### Step 9: Cleanup Redis Pub/Sub

After successful migration and monitoring period:

- [ ] Remove Redis Pub/Sub code from services
- [ ] Remove `libs/backend/event-hub` (Redis) dependency
- [ ] Update documentation
- [ ] Keep Redis for caching only

---

## Post-Migration Tasks

- [ ] Update environment variable documentation
- [ ] Update architecture diagrams
- [ ] Remove dual publishing code
- [ ] Monitor message delivery for 1 week

---

## Rollback Procedure

If issues are detected:

### Step 1: Enable Dual Publishing

```bash
# Re-enable dual publishing
export DUAL_PUBLISH=true
```

### Step 2: Switch Consumers Back to Redis

```bash
# Switch consumers to Redis
export USE_RABBITMQ_CONSUMER=false
```

### Step 3: Verify Redis Flow

- [ ] Events published to Redis
- [ ] Consumers receiving from Redis
- [ ] All services functioning

### Step 4: Investigate Issues

- [ ] Check RabbitMQ logs
- [ ] Check service logs
- [ ] Check message delivery
- [ ] Identify root cause

---

## Event Type Migration Mapping

| Redis Event           | RabbitMQ Routing Key       | Status      |
| --------------------- | -------------------------- | ----------- |
| user:registered       | auth.user.registered       | Not Started |
| user:login            | auth.user.login            | Not Started |
| user:logout           | auth.user.logout           | Not Started |
| user:password-changed | auth.user.password-changed | Not Started |
| payment:created       | payments.payment.created   | Not Started |
| payment:updated       | payments.payment.updated   | Not Started |
| payment:completed     | payments.payment.completed | Not Started |
| payment:failed        | payments.payment.failed    | Not Started |
| audit:created         | admin.audit.created        | Not Started |
| config:updated        | admin.config.updated       | Not Started |

---

## Validation Checklist Summary

| Check                 | Expected | Actual | Status      |
| --------------------- | -------- | ------ | ----------- |
| RabbitMQ running      | Complete | -      | Not Started |
| Exchanges created     | 2        | -      | Not Started |
| Queues created        | 5+       | -      | Not Started |
| Message delivery rate | > 99.9%  | -      | Not Started |
| DLQ messages          | 0        | -      | Not Started |
| Consumer lag          | < 100ms  | -      | Not Started |

---

**Last Updated:** 2026-12-10  
**Status:** Template  
**Next Steps:** Complete during Phase 3 (Event Hub Migration)
