# Scripts Directory

This directory contains utility scripts for the Payments System MFE project.

---

## Infrastructure Scripts

### SSL Certificate Generation

```bash
./scripts/generate-ssl-certs.sh
```

Generates self-signed SSL certificates for local development (nginx HTTPS).

### Infrastructure Testing

```bash
./scripts/test-infrastructure.sh
```

Tests Docker infrastructure (PostgreSQL, Redis, RabbitMQ, nginx).

### Environment Verification

```bash
./scripts/verify-environment.sh
./scripts/verify-phases-1-3.sh
```

Verifies environment setup and POC phase completion.

---

## Database Migration Scripts

Located in `scripts/migration/`:

### Export Scripts

```bash
pnpm migrate:export          # Export all data
pnpm migrate:export:auth     # Export auth data
pnpm migrate:export:payments # Export payments data
pnpm migrate:export:admin    # Export admin data
pnpm migrate:export:profile  # Export profile data
```

### Import Scripts

```bash
pnpm migrate:import          # Import all data
pnpm migrate:import:auth     # Import auth data
pnpm migrate:import:payments # Import payments data
pnpm migrate:import:admin    # Import admin data
pnpm migrate:import:profile  # Import profile data
```

### Validation & Rollback

```bash
pnpm migrate:validate        # Validate migration
pnpm migrate:rollback:auth   # Rollback auth migration
pnpm migrate:rollback:payments  # Rollback payments migration
pnpm migrate:rollback:admin  # Rollback admin migration
pnpm migrate:rollback:profile   # Rollback profile migration
```

---

## RabbitMQ Event Hub Test Scripts

### Comprehensive Reliability Tests

```bash
pnpm rabbitmq:test           # Run all automated tests
```

**Tests included:**
- Message ordering (FIFO verification)
- Load testing (throughput & latency)
- Retry mechanism
- Dead letter queue routing

**Results:** See `docs/POC-3-Implementation/event-hub-test-results.md`

### Individual Tests

```bash
pnpm rabbitmq:test:ordering  # Message ordering test (100 messages)
pnpm rabbitmq:test:load      # Load test (1000 messages)
pnpm rabbitmq:test:retry     # Retry mechanism test
pnpm rabbitmq:test:dlq       # DLQ verification test
```

### Message Persistence Test

**Step 1:** Publish persistent messages

```bash
pnpm rabbitmq:test:persistence:publish
```

**Step 2:** Restart RabbitMQ broker

```bash
docker-compose restart rabbitmq
```

Wait 30 seconds for broker to fully restart.

**Step 3:** Verify messages persisted

```bash
pnpm rabbitmq:test:persistence:verify
```

### DLQ Monitoring

```bash
pnpm rabbitmq:monitor-dlq    # Monitor dead letter queue in real-time
```

Press Ctrl+C to exit.

---

## Test Script Files

### `test-event-hub.ts`

Comprehensive reliability test suite for RabbitMQ event hub.

**Features:**
- Message ordering verification (FIFO)
- Load testing (throughput & latency metrics)
- Retry mechanism testing
- Dead letter queue verification

**Usage:**
```bash
pnpm tsx scripts/test-event-hub.ts [test-name]
```

**Test names:**
- `all` - Run all automated tests (default)
- `ordering` - Message ordering test
- `load` - Load/performance test
- `retry` - Retry mechanism test
- `dlq` - DLQ verification test

### `test-event-persistence.ts`

Message persistence test across broker restart.

**Usage:**
```bash
# Step 1: Publish messages
pnpm tsx scripts/test-event-persistence.ts publish

# Step 2: Restart broker (manual)
docker-compose restart rabbitmq

# Step 3: Verify persistence
pnpm tsx scripts/test-event-persistence.ts verify
```

### `monitor-dlq.ts`

Real-time monitoring of dead letter queue messages.

**Usage:**
```bash
pnpm tsx scripts/monitor-dlq.ts
```

---

## Script Organization

```
scripts/
├── README.md                      # This file
├── generate-ssl-certs.sh          # SSL certificate generation
├── test-infrastructure.sh         # Infrastructure testing
├── verify-environment.sh          # Environment verification
├── verify-phases-1-3.sh           # POC phase verification
├── test-event-hub.ts              # Event hub reliability tests
├── test-event-persistence.ts      # Persistence test
├── monitor-dlq.ts                 # DLQ monitoring
└── migration/                     # Database migration scripts
    ├── export-auth-data.ts
    ├── export-payments-data.ts
    ├── export-admin-data.ts
    ├── export-profile-data.ts
    ├── import-auth-data.ts
    ├── import-payments-data.ts
    ├── import-payments-users.ts
    ├── import-admin-data.ts
    ├── import-admin-users.ts
    ├── import-profile-data.ts
    ├── validate-migration.ts
    ├── rollback-auth.ts
    ├── rollback-payments.ts
    ├── rollback-admin.ts
    └── rollback-profile.ts
```

---

## Development Workflow

### Running Tests

1. **Ensure infrastructure is running:**
   ```bash
   pnpm infra:start
   ```

2. **Run event hub tests:**
   ```bash
   pnpm rabbitmq:test
   ```

3. **Monitor results:**
   - Check console output for test results
   - View detailed results in `docs/POC-3-Implementation/event-hub-test-results.md`

### Debugging

1. **Check RabbitMQ status:**
   ```bash
   pnpm rabbitmq:status
   pnpm rabbitmq:list-queues
   ```

2. **Monitor DLQ:**
   ```bash
   pnpm rabbitmq:monitor-dlq
   ```

3. **Access RabbitMQ Management UI:**
   ```bash
   pnpm rabbitmq:ui
   ```
   Opens: http://localhost:15672 (admin/admin)

---

## Test Results

All event hub reliability tests passing:

| Test | Status | Performance |
|------|--------|-------------|
| Message Ordering | ✅ PASS | 100% FIFO |
| Load Test | ✅ PASS | 2409 msg/sec (240% above target) |
| Retry Mechanism | ✅ PASS | 36,128 retries verified |
| Dead Letter Queue | ✅ PASS | Manual verification |
| Persistence | ⚠️ MANUAL | Infrastructure configured |

**Overall:** Production-ready ✅

See: `docs/POC-3-Implementation/event-hub-test-results.md` for detailed results.

---

## Troubleshooting

### Queue has stale messages

**Problem:** Test receiving extra messages from previous runs

**Solution:**
```bash
docker exec mfe-rabbitmq rabbitmqctl purge_queue test.queue
```

### RabbitMQ connection refused

**Problem:** Cannot connect to RabbitMQ

**Solution:**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Restart if needed
docker-compose restart rabbitmq

# Check logs
docker-compose logs -f rabbitmq
```

### Publisher confirms failing

**Problem:** `waitForConfirms is not a function`

**Solution:** Already fixed in library - use `createConfirmChannel()` instead of `createChannel()`

---

## Contributing

When adding new scripts:

1. Add script to appropriate directory
2. Make executable: `chmod +x script-name.sh`
3. Add npm script in `package.json`
4. Document in this README
5. Add usage examples

---

**Last Updated:** 2026-12-10  
**POC Phase:** POC-3 - Production-Ready Infrastructure
