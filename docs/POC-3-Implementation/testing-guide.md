# Comprehensive Testing Guide - POC-3

**Status:** In Progress  
**Date:** 2026-12-10  
**Phase:** POC-3 - Production-Ready Infrastructure

---

## Overview

POC-3 extends the comprehensive testing strategy from POC-2 with additional tests for production-ready infrastructure including nginx reverse proxy, separate databases, RabbitMQ event hub, WebSocket support, and enhanced observability.

**Testing Stack:**

- **Unit Tests:** Jest + React Testing Library (Frontend), Jest (Backend)
- **Integration Tests:** Jest + React Testing Library (Frontend), Jest (Backend)
- **Infrastructure Tests:** Shell scripts + Docker health checks
- **Migration Tests:** TypeScript migration scripts with validation
- **Full-Stack Integration Tests:** Playwright with backend API verification
- **E2E Tests:** Playwright
- **Load Tests:** (Planned) Artillery/k6 for performance testing

**Coverage Target:** 70%+ (maintaining POC-2 coverage)

---

## POC-3 Testing Additions

### Infrastructure Testing

**New Test Areas:**

1. **nginx Reverse Proxy**
   - SSL/TLS certificate validation
   - Rate limiting verification
   - Security headers validation
   - WebSocket proxy functionality
   - Load balancing (planned)

2. **Separate Databases**
   - Service isolation verification
   - Cross-service data integrity
   - Migration validation scripts
   - Rollback procedures

3. **RabbitMQ Event Hub**
   - Exchange/queue configuration
   - Event routing verification
   - Dead letter queue handling
   - Event persistence

4. **WebSocket Support**
   - Connection establishment
   - Authentication flow
   - Real-time message delivery
   - Reconnection logic
   - Cross-tab synchronization

5. **Observability**
   - Error tracking (Sentry integration)
   - Metrics collection (Prometheus)
   - Distributed tracing (OpenTelemetry)
   - Log aggregation

---

## Testing Strategy

### Test Pyramid (POC-3)

```
        ┌─────────────────────┐
        │   E2E Tests         │  (50+ tests from POC-2 + new)
        │   Playwright        │  + WebSocket, nginx, migration
        └─────────────────────┘
       ┌─────────────────────────┐
       │ Full-Stack Integration  │  (35+ tests from POC-2)
       │ Tests                   │  + RabbitMQ, WebSocket
       └─────────────────────────┘
      ┌─────────────────────────────┐
      │ Integration Tests           │  (90+ tests)
      │ Jest + Infrastructure       │  + Migration, RabbitMQ
      └─────────────────────────────┘
     ┌─────────────────────────────────┐
     │   Unit Tests                   │  (186+ tests from POC-2)
     │   Jest                          │  (maintained)
     └─────────────────────────────────┘
    ┌─────────────────────────────────────┐
    │ Infrastructure Tests                │  (New for POC-3)
    │ Shell Scripts + Docker              │  nginx, DB, RabbitMQ
    └─────────────────────────────────────┘
```

### Test Distribution (POC-3)

**Frontend (from POC-2):**

- Unit Tests: 86+ tests (maintained)
- Integration Tests: 40+ tests (maintained)
- Full-Stack Integration Tests: 35+ tests (maintained)
- E2E Tests: 50+ tests (maintained)

**Backend (from POC-2):**

- Unit Tests: 100+ tests (maintained)
- Integration Tests: 50+ tests (maintained)
- API Contract Tests: 22 endpoints (maintained)

**Infrastructure (New for POC-3):**

- nginx Tests: 8+ checks (SSL, headers, rate limiting)
- Database Tests: 7+ checks (connections, migrations)
- RabbitMQ Tests: 5+ checks (exchanges, queues, bindings)
- Migration Scripts: 13 scripts with validation

**Total:** 400+ tests (380+ from POC-2 + 20+ new infrastructure tests)

---

## Infrastructure Testing

### nginx Reverse Proxy Tests

**Script:** `scripts/test-infrastructure.sh`

**Test Coverage:**

```bash
# Run infrastructure tests
pnpm infra:test

# Individual tests
./scripts/test-infrastructure.sh
```

**Tests Included:**

1. **HTTP to HTTPS Redirect**

   ```bash
   curl -I http://localhost/ | grep "301 Moved Permanently"
   curl -I http://localhost/ | grep "Location: https://localhost/"
   ```

2. **HTTPS Access**

   ```bash
   curl -k -I https://localhost/ | grep "200 OK"
   ```

3. **Security Headers**

   ```bash
   curl -k -s -i https://localhost/ | grep "X-Frame-Options: DENY"
   curl -k -s -i https://localhost/ | grep "X-Content-Type-Options: nosniff"
   curl -k -s -i https://localhost/ | grep "Content-Security-Policy"
   ```

4. **SSL Certificate Validity**

   ```bash
   openssl x509 -in nginx/ssl/self-signed.crt -noout -dates
   ```

5. **nginx Configuration Syntax**

   ```bash
   docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:latest nginx -t
   ```

6. **Rate Limiting** (Manual)
   ```bash
   # Test rate limit (100 req/min for API)
   for i in {1..105}; do curl -s http://localhost/api/health > /dev/null; done
   # Should see 429 Too Many Requests after 100 requests
   ```

### Database Tests

**Tests:**

1. **Database Connections**

   ```bash
   # Check all databases accessible
   psql -h localhost -p 5432 -U postgres -d auth_db -c "SELECT 1"
   psql -h localhost -p 5433 -U postgres -d payments_db -c "SELECT 1"
   psql -h localhost -p 5434 -U postgres -d admin_db -c "SELECT 1"
   psql -h localhost -p 5435 -U postgres -d profile_db -c "SELECT 1"
   psql -h localhost -p 5436 -U postgres -d mfe_poc2 -c "SELECT 1"
   ```

2. **Service Isolation**

   ```bash
   # Verify auth_db only has auth tables
   psql -h localhost -p 5432 -U postgres -d auth_db -c "\dt"
   # Should show: users, refresh_tokens
   ```

3. **Prisma Schema Validation**
   ```bash
   pnpm db:all:validate
   # Validates all 4 service-specific schemas
   ```

### RabbitMQ Tests

**Tests:**

1. **Exchanges Configuration**

   ```bash
   pnpm rabbitmq:list-exchanges
   # Should show: events (topic), events.dlx (direct)
   ```

2. **Queues Configuration**

   ```bash
   pnpm rabbitmq:list-queues
   # Should show: auth.events.queue, payments.events.queue,
   #              admin.events.queue, profile.events.queue, events.dlq
   ```

3. **Bindings Configuration**

   ```bash
   pnpm rabbitmq:list-bindings
   # Verify routing keys properly configured
   ```

4. **RabbitMQ Health**
   ```bash
   docker exec mfe-rabbitmq rabbitmq-diagnostics ping
   ```

### Redis Tests

**Tests:**

1. **Redis Connection**

   ```bash
   pnpm redis:ping
   # Should return: PONG
   ```

2. **Redis Info**
   ```bash
   pnpm redis:info
   # Should show Redis server info
   ```

---

## Migration Testing

### Migration Scripts

**Location:** `scripts/migration/`

**Scripts:**

1. **Export Scripts** (4)
   - `export-auth-data.ts`
   - `export-payments-data.ts`
   - `export-admin-data.ts`
   - `export-profile-data.ts`

2. **Import Scripts** (4)
   - `import-auth-data.ts`
   - `import-payments-data.ts`
   - `import-admin-data.ts`
   - `import-profile-data.ts`

3. **Validation Script**
   - `validate-migration.ts` - Compares row counts between legacy and new databases

4. **Rollback Scripts** (4)
   - `rollback-auth.ts`
   - `rollback-payments.ts`
   - `rollback-admin.ts`
   - `rollback-profile.ts`

### Running Migration Tests

```bash
# Export all data
pnpm migrate:export

# Import all data
pnpm migrate:import

# Validate migration
pnpm migrate:validate

# Should output:
# PASS Users: 10 rows (matched)
# PASS Refresh Tokens: 5 rows (matched)
# PASS Payments: 25 rows (matched)
# PASS Payment Transactions: 50 rows (matched)
# PASS Audit Logs: 100 rows (matched)
# PASS System Config: 3 rows (matched)
# PASS User Profiles: 10 rows (matched)
```

### Migration Test Strategy

1. **Pre-Migration Validation**
   - Verify legacy database has data
   - Check target databases are empty
   - Validate Prisma schemas

2. **Migration Execution**
   - Run export scripts
   - Verify JSON files created
   - Run import scripts
   - Check import logs for errors

3. **Post-Migration Validation**
   - Run validation script
   - Verify row counts match
   - Test service functionality
   - Verify data integrity

4. **Rollback Testing**
   - Test rollback scripts work
   - Verify confirmation prompts
   - Re-run migration

---

## WebSocket Testing

### Unit Tests (Planned)

**Framework:** Jest

**Coverage:**

- WebSocket connection manager
- Authentication middleware
- Message routing
- Event handling
- Reconnection logic

**Example Test:**

```typescript
describe('WebSocket Connection Manager', () => {
  it('should authenticate connection with valid token', async () => {
    const token = generateValidToken();
    const result = await connectionManager.authenticate(token);
    expect(result.authenticated).toBe(true);
  });

  it('should reject connection with invalid token', async () => {
    const token = 'invalid.token';
    const result = await connectionManager.authenticate(token);
    expect(result.authenticated).toBe(false);
  });
});
```

### Integration Tests (Planned)

**Framework:** Jest + real WebSocket client

**Coverage:**

- End-to-end message delivery
- Room/channel functionality
- Cross-tab synchronization
- Heartbeat/ping-pong

**Example Test:**

```typescript
describe('WebSocket Integration', () => {
  it('should deliver payment update to connected client', async () => {
    const client = await connectWebSocket(validToken);
    const messagePromise = waitForMessage(client, 'payment:updated');

    // Trigger payment update
    await updatePaymentStatus(paymentId, 'completed');

    const message = await messagePromise;
    expect(message.type).toBe('payment:updated');
    expect(message.payload.id).toBe(paymentId);
  });
});
```

### E2E Tests (Planned)

**Framework:** Playwright

**Coverage:**

- WebSocket connection in browser
- Real-time updates in UI
- Session sync across tabs
- Reconnection after disconnect

---

## RabbitMQ Event Hub Testing

### Unit Tests (Planned)

**Framework:** Jest

**Coverage:**

- Event publisher
- Event subscriber
- Event routing
- Error handling
- Dead letter queue

**Example Test:**

```typescript
describe('RabbitMQ Event Publisher', () => {
  it('should publish auth event to correct exchange', async () => {
    const event = { type: 'auth.user.created', userId: '123' };
    await eventPublisher.publish('auth.user.created', event);

    // Verify event in queue
    const message = await consumeFromQueue('auth.events.queue');
    expect(message.type).toBe('auth.user.created');
  });
});
```

### Integration Tests (Planned)

**Framework:** Jest + real RabbitMQ

**Coverage:**

- End-to-end event flow
- Multiple consumers
- Event persistence
- Dead letter queue handling

**Example Test:**

```typescript
describe('RabbitMQ Integration', () => {
  it('should route user events to profile service', async () => {
    const subscriber = await subscribeToQueue('profile.events.queue');

    // Publish user event
    await publishEvent('auth.user.created', {
      userId: '123',
      email: 'test@example.com',
    });

    // Profile service should receive event
    const event = await subscriber.waitForMessage();
    expect(event.type).toBe('auth.user.created');
    expect(event.payload.userId).toBe('123');
  });
});
```

---

## Running Tests

### Infrastructure Tests

```bash
# Run infrastructure test script
pnpm infra:test
./scripts/test-infrastructure.sh

# Check service status
pnpm infra:status

# Check RabbitMQ
pnpm rabbitmq:list-exchanges
pnpm rabbitmq:list-queues

# Check databases
docker exec mfe-auth-db pg_isready
docker exec mfe-payments-db pg_isready
```

### Migration Tests

```bash
# Export data
pnpm migrate:export

# Import data
pnpm migrate:import

# Validate migration
pnpm migrate:validate

# Rollback (with confirmation)
pnpm migrate:rollback:auth
```

### Frontend Tests (from POC-2)

```bash
# Run all frontend tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm e2e
```

### Backend Tests (from POC-2)

```bash
# Run all backend tests
pnpm test:backend

# Run specific service
pnpm test:auth-service
pnpm test:payments-service
```

---

## Test Coverage (POC-3)

### Infrastructure Coverage

- **nginx:** PASS - 8 checks (SSL, headers, rate limiting, config)
- **Databases:** PASS - 7 checks (connections, isolation, migrations)
- **RabbitMQ:** PASS - 5 checks (exchanges, queues, bindings, health)
- **Redis:** PASS - 2 checks (connection, info)
- **Migration Scripts:** PASS - 13 scripts (export, import, validate, rollback)

### Application Coverage (from POC-2)

- **Frontend:** PASS - 70%+ (maintained)
- **Backend:** PASS - 70%+ (maintained)
- **API Contracts:** PASS - 22 endpoints (maintained)

### Planned Coverage (POC-3)

- **WebSocket:** (Planned) Unit + Integration tests
- **RabbitMQ Events:** (Planned) Unit + Integration tests
- **Load Tests:** (Planned) Performance testing
- **Observability:** (Planned) Error tracking, metrics

---

## Best Practices (POC-3)

### From POC-2 (Maintained)

1. **Write Tests Alongside Code** - Don't defer testing
2. **Aim for 70%+ Coverage** - All projects meet this target
3. **Test Behavior, Not Implementation** - Test what users see/do
4. **Use Descriptive Test Names** - Clear test descriptions
5. **Mock External Dependencies** - Mock APIs, databases, etc.
6. **Test Error Cases** - Don't just test happy paths
7. **Keep Tests Fast** - Unit tests should be fast
8. **Test Full-Stack Integration** - Verify frontend + backend work together

### New for POC-3

9. **Test Infrastructure Early** - Validate nginx, DB, RabbitMQ setup before coding
10. **Validate Migrations** - Always run migration validation script
11. **Test Rollback Procedures** - Ensure rollback scripts work
12. **Monitor Infrastructure Health** - Use health checks and monitoring
13. **Test Real-Time Features** - WebSocket tests should use real connections
14. **Test Event Routing** - Verify RabbitMQ events reach correct consumers
15. **Load Test Critical Paths** - Test rate limiting, connection limits
16. **Test Observability** - Verify Sentry, Prometheus integration

---

## Testing Checklist

### Phase 2: Infrastructure Setup (Complete)

- [x] nginx configuration validated
- [x] SSL certificates generated and tested
- [x] All databases accessible
- [x] RabbitMQ topology configured
- [x] Redis connection verified
- [x] Docker health checks passing
- [x] Migration scripts created
- [x] Infrastructure test script created

### Phase 3: Backend Migration (In Progress)

- [ ] Migration scripts tested with sample data
- [ ] Validation script verifies all data migrated
- [ ] Services updated to use new databases
- [ ] Service-specific Prisma clients generated
- [ ] Inter-service communication tested

### Phase 4: RabbitMQ Integration (Planned)

- [ ] Event publishers implemented
- [ ] Event subscribers implemented
- [ ] Event routing tested
- [ ] Dead letter queue tested
- [ ] Event persistence verified

### Phase 5: WebSocket Implementation (Planned)

- [ ] WebSocket server implemented
- [ ] Authentication flow tested
- [ ] Message routing tested
- [ ] Reconnection logic tested
- [ ] Cross-tab sync tested

### Phase 6: Observability (Planned)

- [ ] Sentry error tracking configured
- [ ] Prometheus metrics configured
- [ ] OpenTelemetry tracing configured
- [ ] Log aggregation configured
- [ ] Dashboards created

---

## Test Scripts Reference

### Infrastructure Scripts

```bash
# Infrastructure management
pnpm infra:start          # Start all services
pnpm infra:stop           # Stop all services
pnpm infra:status         # Check service status
pnpm infra:test           # Run infrastructure tests
pnpm infra:clean          # Clean up volumes

# SSL certificates
pnpm ssl:generate         # Generate SSL certificates

# Database operations
pnpm db:all:generate      # Generate all Prisma clients
pnpm db:all:migrate       # Run all migrations
pnpm db:auth:studio       # Open Prisma Studio for auth_db
pnpm db:payments:studio   # Open Prisma Studio for payments_db

# RabbitMQ operations
pnpm rabbitmq:ui          # Open RabbitMQ management UI
pnpm rabbitmq:list-exchanges
pnpm rabbitmq:list-queues
pnpm rabbitmq:list-bindings

# Redis operations
pnpm redis:ping
pnpm redis:info
pnpm redis:keys
```

### Migration Scripts

```bash
# Export data
pnpm migrate:export       # Export all data
pnpm migrate:export:auth  # Export auth data only

# Import data
pnpm migrate:import       # Import all data
pnpm migrate:import:auth  # Import auth data only

# Validate migration
pnpm migrate:validate     # Validate all migrations

# Rollback migration
pnpm migrate:rollback:auth      # Rollback auth database
pnpm migrate:rollback:payments  # Rollback payments database
```

---

## Troubleshooting Tests

### Infrastructure Tests Failing

**Issue:** nginx tests fail with "connection refused"

**Solution:**

```bash
# Check nginx is running
pnpm infra:status

# Check nginx logs
docker logs mfe-nginx

# Restart nginx
docker restart mfe-nginx
```

**Issue:** Database tests fail with "connection timeout"

**Solution:**

```bash
# Check database health
docker exec mfe-auth-db pg_isready

# Check database logs
docker logs mfe-auth-db

# Restart database
docker restart mfe-auth-db
```

### Migration Tests Failing

**Issue:** Migration validation shows mismatched row counts

**Solution:**

```bash
# Check export files exist
ls -la migration-data/

# Re-run export
pnpm migrate:export

# Check import logs for errors
pnpm migrate:import 2>&1 | tee migration-import.log

# Rollback and retry
pnpm migrate:rollback:auth
pnpm migrate:import:auth
```

---

## Related Documentation

- [`implementation-plan.md`](./implementation-plan.md) - POC-3 implementation plan
- [`task-list.md`](./task-list.md) - Task tracking
- [`database-migration-strategy.md`](./database-migration-strategy.md) - Database migration strategy
- [`event-hub-migration-strategy.md`](./event-hub-migration-strategy.md) - RabbitMQ migration strategy
- [`nginx-configuration-design.md`](./nginx-configuration-design.md) - nginx configuration
- [`../POC-2-Implementation/testing-guide.md`](../POC-2-Implementation/testing-guide.md) - POC-2 testing guide
- [`../POC-2-Implementation/api-contracts.md`](../POC-2-Implementation/api-contracts.md) - API contracts

---

**Last Updated:** 2026-12-10  
**Next Update:** After Phase 3 completion (Backend Migration)
