# MFE POC-3 - Cursor Rules

> **Phase:** POC-3 Only | **Reference:** `docs/POC-3-Implementation/project-rules.md` for detailed rules

---

## Critical Rules

1. **NO throw-away code** - Must carry forward to Production
2. **Never use `any` type** - Documented exceptions only
3. **Always use Tailwind v4 syntax** - Never v3 (CRITICAL)
4. **Fix type errors immediately** - Don't work around them
5. **Write tests alongside code** - 70% coverage minimum
6. **POC-3 scope only** - Production-ready infrastructure, migrations, WebSocket, advanced caching, observability, performance optimizations
7. **DO NOT automatically perform additional tasks** - Only perform tasks explicitly requested in the prompt. If a related task seems helpful, ask for confirmation with a clear description of what you want to implement before proceeding.
8. **MANDATORY: Update BOTH documentation files IMMEDIATELY after ANY task/sub-task completion:**
   - Update `docs/POC-3-Implementation/task-list.md`: Mark checkboxes `[x]`, set Status "Complete", add date, add notes
   - Update `docs/POC-3-Implementation/implementation-plan.md`: Mark ALL verification checkboxes `[x]`, mark ALL acceptance criteria, set Status "Complete", add date, add comprehensive notes, update Files Created section
   - **NON-NEGOTIABLE** - Must be done immediately, before moving to next task. NEVER skip or defer.
9. **Model Selection:** Reference `docs/POC-3-Implementation/model-selection-strategy.md` for model selection guidance (Opus 4.5, Sonnet 4.5, Auto)

---

## POC-3 Scope

**In Scope:**

- Production-ready infrastructure (nginx reverse proxy, load balancing, SSL/TLS termination)
- Separate databases per service (migrate from shared database to one database per microservice)
- Production-ready event hub (RabbitMQ migration from Redis Pub/Sub)
- WebSocket support (real-time updates, session sync)
- Advanced caching strategies (browser, CDN, service worker, Redis)
- Enhanced observability (Sentry error tracking, Prometheus metrics, OpenTelemetry tracing)
- Basic analytics (architecture-focused: MFE metrics, API patterns, system usage)
- Session management (cross-tab sync, cross-device sync - basic implementation)
- Performance optimizations (code splitting, lazy loading, bundle optimization, database indexing, query optimization)
- Optional GraphQL API (alongside REST API)
- API Gateway proxy implementation (fix deferred from POC-2)
- All POC-2 features (real JWT auth, event bus, design system, Admin MFE, backend services)

**NOT in Scope:**

- Real payment processing with PSP integration (all POC phases use stubbed payments - MVP/Production)
- Advanced analytics beyond architecture-focused metrics (MVP)
- Service mesh (Future)
- Multi-region deployment (MVP/Production)
- Real SSL/TLS certificates (self-signed certificates in POC-3, real certificates in MVP)

---

## Tech Stack (POC-3)

**Frontend (New in POC-3):**

- **WebSocket:** Native WebSocket API or `ws` client
- **GraphQL (Optional):** `@apollo/client` or `urql`
- **Caching:** `workbox` (service worker), Service Worker API
- **Observability:** `@sentry/react`
- **Session Management:** `libs/shared-session-sync`
- **Analytics:** `libs/shared-analytics`

**Backend (New in POC-3):**

- **Event Hub:** `amqplib` or `amqp.node` (RabbitMQ), `rabbitmq` server
- **WebSocket:** `ws` or `socket.io`
- **GraphQL (Optional):** `apollo-server-express` or `graphql-yoga`
- **Observability:** `@sentry/node`, `prometheus-client`, `@opentelemetry/api`
- **Infrastructure:** `nginx`

**Existing (from POC-2):**

- React 19.2.0, Nx, Rspack, Module Federation v2, React Router 7.x, Zustand 4.5.x, TanStack Query 5.x, React Hook Form 7.52.x, Zod 3.23.x, Tailwind CSS 4.0+, shadcn/ui, Axios 1.7.x, Jest 30.x, React Testing Library 16.1.x, Playwright, Node.js 24.11.x LTS, Express, PostgreSQL 16.x, Prisma 5.x, JWT, bcrypt, Redis 7.x, Winston 3.x, Vitest 2.0.x, Supertest 7.x

---

## Infrastructure Rules

### nginx Reverse Proxy

- **MUST:** Configure nginx as reverse proxy
- **MUST:** Implement load balancing
- **MUST:** Configure SSL/TLS termination (self-signed certificates in POC-3)
- **MUST:** Set up request routing
- **MUST:** Configure security headers
- **MUST:** Set up rate limiting
- **MUST:** Configure compression (gzip, brotli)
- **MUST:** Update frontend API client to use nginx proxy URL (not direct service URLs)

### API Gateway Proxy Fix

- **MUST:** Fix API Gateway proxy deferred from POC-2
- **MUST:** Implement request body forwarding
- **MUST:** Test with all HTTP methods
- **MUST:** Update frontend to use API Gateway URL (via nginx)

---

## Database Migration Rules

### Separate Databases per Service

- **MUST:** Migrate from shared database to separate databases
- **MUST:** Create one database per service (auth_db, payments_db, admin_db, profile_db)
- **MUST:** Update Prisma schemas for each service
- **MUST:** Create migration scripts
- **MUST:** Plan data migration strategy
- **MUST:** Test data integrity
- **MUST:** Plan rollback strategy

---

## Event Hub Migration Rules

### RabbitMQ Migration

- **MUST:** Migrate from Redis Pub/Sub to RabbitMQ
- **MUST:** Set up RabbitMQ infrastructure
- **MUST:** Migrate event types and handlers
- **MUST:** Update service event publishing and subscribing
- **MUST:** Test event delivery and reliability
- **MUST:** Maintain backward compatibility during migration

---

## WebSocket Rules

### WebSocket Implementation

- **MUST:** Implement WebSocket server (backend)
- **MUST:** Implement WebSocket client (frontend)
- **MUST:** Implement real-time update patterns
- **MUST:** Implement session sync via WebSocket
- **MUST:** Implement connection management and reconnection logic
- **MUST:** Implement WebSocket security (authentication, authorization)

---

## Caching Rules

### Advanced Caching Strategies

- **MUST:** Implement service worker for browser caching
- **MUST:** Configure CDN caching headers
- **MUST:** Implement Redis query result caching
- **MUST:** Implement session caching
- **MUST:** Implement cache invalidation strategies
- **MUST:** Monitor cache performance

---

## Observability Rules

### Enhanced Observability

- **MUST:** Integrate Sentry for error tracking (frontend and backend)
- **MUST:** Set up Prometheus metrics collection
- **MUST:** Implement OpenTelemetry distributed tracing
- **MUST:** Configure performance monitoring
- **MUST:** Set up infrastructure monitoring
- **MUST:** Configure basic alerting

---

## Session Management Rules

### Session Synchronization

- **MUST:** Implement cross-tab session sync
- **MUST:** Implement cross-device session sync
- **MUST:** Implement session storage patterns
- **MUST:** Implement session invalidation
- **MUST:** Implement session security
- **MUST:** Implement backend session management

---

## Performance Optimization Rules

### Frontend Performance

- **MUST:** Implement code splitting
- **MUST:** Implement lazy loading
- **MUST:** Optimize bundle sizes
- **MUST:** Implement tree shaking
- **MUST:** Optimize images
- **MUST:** Use resource hints (preload, prefetch)

### Backend Performance

- **MUST:** Add database indexes
- **MUST:** Optimize database queries
- **MUST:** Configure connection pooling
- **MUST:** Implement caching strategies
- **MUST:** Configure response compression
- **MUST:** Test load balancing

---

## GraphQL Rules (Optional)

### Optional GraphQL API

- **MAY:** Implement GraphQL API alongside REST API
- **MUST:** Use GraphQL server (Apollo Server or GraphQL Yoga) if implemented
- **MUST:** Use GraphQL client (Apollo Client or urql) if implemented
- **MUST:** Define GraphQL schema
- **MUST:** Implement resolvers
- **MUST:** Set query complexity and depth limits
- **MUST NOT:** Replace REST API (GraphQL is optional, alongside REST)

---

## Analytics Rules

### Basic Analytics

- **MUST:** Implement basic analytics (architecture-focused)
- **MUST:** Track MFE metrics (load times, errors, usage)
- **MUST:** Track API patterns (endpoint usage, response times)
- **MUST:** Track system usage (user activity, feature usage)
- **MUST NOT:** Implement business analytics (MVP)
- **MUST NOT:** Implement user behavior analytics (MVP)

---

## Testing Rules

### Infrastructure Testing

- **MUST:** Test nginx configuration
- **MUST:** Test SSL/TLS setup
- **MUST:** Test load balancing
- **MUST:** Test database migrations
- **MUST:** Test event hub migration
- **MUST:** Test WebSocket connections
- **MUST:** Test caching strategies
- **MUST:** Test observability tools

### Performance Testing

- **MUST:** Perform load testing
- **MUST:** Perform stress testing
- **MUST:** Benchmark performance
- **MUST:** Analyze bundle sizes
- **MUST:** Analyze database query performance
- **MUST:** Analyze cache hit rates

---

## Git & Documentation Rules

### Git Commits

- **MUST:** Ask for user confirmation before making any git commits
- **MUST:** Show commit message and changed files before committing
- **MUST NOT:** Commit automatically without explicit user approval
- **MUST:** Perform a git commit after completing each major/top-level phase
- **MUST:** Commit only after verifying everything works and updating status in both `task-list.md` and `implementation-plan.md`
- **MUST:** Commit before asking user whether to proceed to the next phase

### Documentation Files

- **MUST:** Create all documentation files in `docs/POC-3-Implementation/` folder
- **MUST:** Update both `task-list.md` and `implementation-plan.md` after each task
- **MUST:** Reference `model-selection-strategy.md` for model selection
- **MUST:** Ask for confirmation if documentation location is unclear

---

## Task Management & Workflow

### Task Progression

- **MUST:** Follow `docs/POC-3-Implementation/implementation-plan.md` for detailed task steps
- **MUST:** Update `docs/POC-3-Implementation/task-list.md` after completing each task/sub-task
- **MUST:** Update `docs/POC-3-Implementation/implementation-plan.md` after completing each task/sub-task (mark verification checkboxes and update status)
- **MUST:** Ask for user confirmation before proceeding to the next task after completing each task or sub-task
- **MUST:** Show completed task summary and next task details when asking for confirmation
- **MUST NOT:** Automatically proceed to next task without explicit user approval
- **MUST:** Reference `model-selection-strategy.md` for model selection (Opus 4.5, Sonnet 4.5, Auto)

### Package.json Scripts

- **MUST:** Add relevant commands to root `package.json` scripts section when creating new features, apps, libraries, or testing configurations
- **MUST:** Follow the existing naming convention: `feature:project` (e.g., `dev:shell`, `dev:auth-mfe`, `test:payments-mfe`)
- **MUST:** Include both individual project commands and aggregate commands (e.g., `dev` for all, `dev:shell` for one)
- **MUST:** Add affected commands when applicable (e.g., `build:affected`, `test:affected`)

### Task Completion Checklist

- Task completed according to implementation plan
- Verification checklist items completed
- Acceptance criteria met
- Task list updated with completion status (`task-list.md`)
- Implementation plan updated with completion status (`implementation-plan.md`)
- User confirmation obtained before next task

---

## Before Committing

TypeScript compiles | ESLint passes | Tests pass | Build works | No `any` types | Tests written | Module Federation works | Tailwind v4 syntax | Real JWT auth works | Backend API integration works | Event bus works | Design system components used | nginx configuration works | Database migrations successful | RabbitMQ event hub works | WebSocket connections work | Observability tools integrated

---

## Success Criteria

All MFEs run (4200, 4201, 4202, 4203, 4204) | nginx reverse proxy works | SSL/TLS configured | Separate databases per service | RabbitMQ event hub operational | WebSocket real-time updates work | Advanced caching strategies implemented | Observability tools (Sentry, Prometheus, OpenTelemetry) integrated | Session management (cross-tab, cross-device) works | Performance optimizations applied | API Gateway proxy fixed | Tests pass (70% coverage) | All migrations successful | Infrastructure deployment works

---

## Common Pitfalls to Avoid

- **CRITICAL:** Forgetting to update `task-list.md` and `implementation-plan.md` - MANDATORY
- Using `any` type without justification
- Creating throw-away code
- Ignoring TypeScript errors
- Using Tailwind v3 syntax (must use v4)
- Skipping tests
- Breaking existing patterns
- Not following project structure
- Hardcoding values (use environment variables)
- Creating circular dependencies
- Mixing concerns (keep components, hooks, utilities separate)
- Using direct service URLs (must use nginx proxy)
- Not migrating databases properly
- Not migrating event hub properly
- Not implementing WebSocket security
- Not implementing session security
- Integrating with real PSP (must use stubbed backend operations)
- Not following model selection strategy
- Deferring documentation updates

---

## Quick Reference

### nginx Configuration

```nginx
# nginx/nginx.conf
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### WebSocket Client

```typescript
// libs/shared-websocket/src/index.ts
export class WebSocketClient {
  private ws: WebSocket | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => console.log('WebSocket connected');
    this.ws.onmessage = event => this.handleMessage(event);
    this.ws.onerror = error => console.error('WebSocket error:', error);
    this.ws.onclose = () => this.reconnect();
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    // Handle message
  }

  private reconnect() {
    // Reconnection logic
  }
}
```

### RabbitMQ Event Publisher

```typescript
// Backend event publisher
import amqp from 'amqplib';

async function publishEvent(eventType: string, payload: unknown) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const exchange = 'events';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  channel.publish(exchange, eventType, Buffer.from(JSON.stringify(payload)));

  await channel.close();
  await connection.close();
}
```

---

## References

- Architecture: `docs/References/mfe-poc3-architecture.md`
- Backend Architecture: `docs/References/backend-poc3-architecture.md`
- Full-Stack Architecture: `docs/References/fullstack-architecture.md`
- Detailed Rules: `docs/POC-3-Implementation/project-rules.md`
- Model Selection: `docs/POC-3-Implementation/model-selection-strategy.md`
- Implementation Plan: `docs/POC-3-Implementation/implementation-plan.md` (when created)
- Task List: `docs/POC-3-Implementation/task-list.md` (when created)
- ADRs: `docs/adr/poc-3/` and `docs/adr/backend/poc-3/`

---

**For detailed rules, examples, and guidance:** See `docs/POC-3-Implementation/project-rules.md`
