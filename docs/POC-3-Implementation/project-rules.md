# Project Rules - POC-3 Implementation

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-12-09  
**Phase:** POC-3 - Production-Ready Infrastructure & Advanced Features

> **Base Rules:** These rules extend the POC-2 rules. See [`../POC-2-Implementation/project-rules.md`](../POC-2-Implementation/project-rules.md) for foundational rules.

---

## 1. POC-3 Scope & Constraints

### 1.1 In Scope

**POC-3 includes:**

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
- Infrastructure deployment (Docker, nginx configuration, SSL/TLS setup)
- All POC-2 features (real JWT auth, event bus, design system, Admin MFE, backend services)

### 1.2 Out of Scope

**POC-3 does NOT include:**

- Real payment processing with PSP integration (all POC phases use stubbed payments - MVP/Production)
- Advanced analytics beyond architecture-focused metrics (MVP)
- Service mesh (Future)
- Multi-region deployment (MVP/Production)
- Real SSL/TLS certificates (self-signed certificates in POC-3, real certificates in MVP)

---

## 2. POC-3 Technology Stack

### 2.1 Frontend Dependencies (POC-3)

**New Dependencies (POC-3):**

**WebSocket:**

- Native WebSocket API or `ws` library (frontend WebSocket client)
- `libs/shared-websocket` - WebSocket client library

**GraphQL (Optional):**

- `@apollo/client` or `urql` - GraphQL client (if GraphQL API implemented)

**Caching:**

- `workbox` - Service worker for advanced caching
- Service Worker API (native)

**Session Management:**

- `libs/shared-session-sync` - Session synchronization library

**Analytics:**

- `libs/shared-analytics` - Basic analytics library (architecture-focused)

**Observability:**

- `@sentry/react` - Sentry error tracking and performance monitoring

**Existing Dependencies (from POC-2):**

- All POC-2 dependencies remain (React 19.2.0, Rspack, Module Federation v2, React Router 7.x, Zustand 4.5.x, TanStack Query 5.x, React Hook Form 7.52.x, Zod 3.23.x, Tailwind CSS 4.0+, shadcn/ui, Axios 1.7.x, Jest 30.x, React Testing Library 16.1.x, Playwright)

### 2.2 Backend Dependencies (POC-3)

**New Dependencies (POC-3):**

**Event Hub:**

- `amqplib` or `amqp.node` - RabbitMQ client (migration from Redis Pub/Sub)
- `rabbitmq` - RabbitMQ server

**WebSocket:**

- `ws` or `socket.io` - WebSocket server

**GraphQL (Optional):**

- `apollo-server-express` or `graphql-yoga` - GraphQL server (if GraphQL API implemented)

**Observability:**

- `@sentry/node` - Sentry error tracking
- `prometheus-client` - Prometheus metrics
- `@opentelemetry/api` - OpenTelemetry tracing

**Caching:**

- `redis@7.x` - Redis for caching (separate from event hub)
- `ioredis@5.x` - Redis client

**Infrastructure:**

- `nginx` - Reverse proxy, load balancing, SSL/TLS

**Existing Dependencies (from POC-2):**

- All POC-2 dependencies remain (Node.js 24.11.x LTS, Express 4.x, PostgreSQL 16.x, Prisma 5.x, JWT, bcrypt, Zod 3.23.x, Winston 3.x, Vitest 2.0.x, Supertest 7.x)

### 2.3 Version Compatibility

All POC-3 dependencies must be compatible with:

- React 19.2.0
- Rspack (latest)
- Module Federation v2 (@module-federation/enhanced 0.21.6)
- TypeScript 5.9.x
- Node.js 24.11.x LTS

---

## 3. Infrastructure Rules

### 3.1 nginx Reverse Proxy

**POC-3 uses nginx for production-ready infrastructure:**

- Reverse proxy for API Gateway
- Load balancing across service instances
- SSL/TLS termination (self-signed certificates in POC-3)
- Static file serving
- Rate limiting at infrastructure level
- Request routing and path rewriting
- Caching headers
- Compression (gzip, brotli)
- Security headers

**Configuration:**

- nginx configuration in `nginx/` directory
- Docker Compose integration
- Environment-based configuration
- SSL/TLS certificate setup (self-signed for POC-3)

### 3.2 API Gateway Proxy Fix

**POC-3 fixes the API Gateway proxy deferred from POC-2:**

- Implement working proxy middleware
- Request body forwarding (fix deferred issue)
- Request/response streaming
- Proper path rewriting
- Header forwarding
- Error handling
- Timeout handling

**Approach:**

- Research and select best proxy approach (see `docs/POC-3-Planning/api-gateway-proxy-implementation.md`)
- Implement with request body streaming
- Test with all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Update frontend to use API Gateway URL (via nginx proxy)

---

## 4. Database Migration Rules

### 4.1 Separate Databases per Service

**POC-3 migrates from shared database to separate databases:**

- One database per microservice
- Database isolation
- Service-specific schemas
- Prisma schema separation
- Migration scripts
- Data migration strategy
- Rollback planning

**Services and Databases:**

- `auth_db` - Auth Service database
- `payments_db` - Payments Service database
- `admin_db` - Admin Service database
- `profile_db` - Profile Service database

**Migration Strategy:**

- Create separate database schemas
- Migrate data from shared database
- Update Prisma schemas and migrations
- Update service configurations
- Test data integrity and service isolation

---

## 5. Event Hub Migration Rules

### 5.1 RabbitMQ Migration

**POC-3 migrates from Redis Pub/Sub to RabbitMQ:**

- RabbitMQ setup and configuration
- Event type migration
- Publisher/subscriber migration
- Reliability patterns
- Message persistence
- Dead letter queues
- Backward compatibility during migration

**Migration Strategy:**

- Set up RabbitMQ infrastructure
- Migrate event types and handlers
- Update service event publishing and subscribing
- Test event delivery and reliability
- Maintain backward compatibility during migration

---

## 6. WebSocket Rules

### 6.1 WebSocket Implementation

**POC-3 implements WebSocket for real-time updates:**

- WebSocket server (backend)
- WebSocket client (frontend)
- Real-time update patterns
- Session sync via WebSocket
- Connection management
- Reconnection logic
- Security (authentication, authorization)

**WebSocket Library:**

- Frontend: Native WebSocket API or `ws` client
- Backend: `ws` or `socket.io`
- Shared library: `libs/shared-websocket`

---

## 7. Caching Rules

### 7.1 Advanced Caching Strategies

**POC-3 implements advanced caching:**

- Service worker for browser caching
- CDN caching headers
- Redis query result caching
- Session caching
- Cache invalidation strategies
- Cache warming
- Cache monitoring

**Caching Layers:**

- Browser caching (service worker)
- CDN caching (headers)
- Redis caching (query results, sessions)
- Application-level caching

---

## 8. Observability Rules

### 8.1 Enhanced Observability

**POC-3 implements enhanced observability:**

- Sentry error tracking (frontend and backend)
- Prometheus metrics collection
- OpenTelemetry distributed tracing
- Performance monitoring
- Infrastructure monitoring
- Log aggregation
- Alerting (basic)

**Observability Stack:**

- Sentry - Error tracking and performance monitoring
- Prometheus - Metrics collection
- OpenTelemetry - Distributed tracing
- Winston - Structured logging (from POC-2)

---

## 9. Session Management Rules

### 9.1 Session Synchronization

**POC-3 implements session management:**

- Cross-tab session sync
- Cross-device session sync
- Session storage patterns
- Session invalidation
- Session security
- Backend session management

**Session Library:**

- `libs/shared-session-sync` - Session synchronization
- WebSocket for real-time sync
- localStorage and sessionStorage
- Backend session storage

---

## 10. Performance Optimization Rules

### 10.1 Frontend Performance

**POC-3 implements frontend performance optimizations:**

- Code splitting
- Lazy loading
- Bundle optimization
- Tree shaking
- Image optimization
- Resource hints (preload, prefetch)

### 10.2 Backend Performance

**POC-3 implements backend performance optimizations:**

- Database indexing
- Query optimization
- Connection pooling
- Caching strategies
- Response compression
- Load balancing

---

## 11. GraphQL Rules (Optional)

### 11.1 Optional GraphQL API

**POC-3 optionally implements GraphQL API:**

- GraphQL server (Apollo Server or GraphQL Yoga)
- GraphQL client (Apollo Client or urql)
- GraphQL schema definition
- Resolvers implementation
- Query complexity limits
- Depth limits
- Alongside REST API (not replacement)

**GraphQL Libraries:**

- Backend: `apollo-server-express` or `graphql-yoga`
- Frontend: `@apollo/client` or `urql`
- Shared: `libs/shared-graphql-client`

---

## 12. Analytics Rules

### 12.1 Basic Analytics

**POC-3 implements basic analytics (architecture-focused):**

- MFE metrics (load times, errors, usage)
- API patterns (endpoint usage, response times)
- System usage (user activity, feature usage)
- Architecture validation metrics
- Business analytics (MVP) - NOT in scope
- User behavior analytics (MVP) - NOT in scope

**Analytics Library:**

- `libs/shared-analytics` - Basic analytics library

---

## 13. Testing Rules

### 13.1 Infrastructure Testing

**POC-3 includes infrastructure testing:**

- nginx configuration testing
- SSL/TLS testing
- Load balancing testing
- Database migration testing
- Event hub migration testing
- WebSocket testing
- Caching testing
- Observability testing

### 13.2 Performance Testing

**POC-3 includes performance testing:**

- Load testing
- Stress testing
- Performance benchmarking
- Bundle size analysis
- Database query performance
- Cache hit rate analysis

---

## 14. Documentation Rules

### 14.1 Required Documentation

**POC-3 Documentation:**

- Implementation plan (`implementation-plan.md`)
- Task list (`task-list.md`)
- Model selection strategy (`model-selection-strategy.md`)
- Project rules (`project-rules.md`)
- Database migration guide (`database-migration-guide.md`)
- Event hub migration guide (`event-hub-migration-guide.md`)
- nginx configuration guide (`nginx-configuration-guide.md`)
- WebSocket implementation guide (`websocket-implementation-guide.md`)
- Caching strategy guide (`caching-strategy-guide.md`)
- Observability setup guide (`observability-setup-guide.md`)
- Session management guide (`session-management-guide.md`)
- Performance optimization guide (`performance-optimization-guide.md`)
- Analytics implementation guide (`analytics-implementation-guide.md`)
- Migration guide (POC-2 to POC-3) (`migration-guide-poc2-to-poc3.md`)
- API Gateway proxy fix documentation (`api-gateway-proxy-fix.md`)
- Developer workflow (`developer-workflow-poc3.md`)
- Testing guide (`testing-guide-poc3.md`)

---

## 15. Migration Path

### 15.1 POC-2 → POC-3

**Migration Considerations:**

- Shared database → Separate databases per service
- Redis Pub/Sub → RabbitMQ event hub
- Direct service URLs → nginx proxy → API Gateway
- No WebSocket → WebSocket support
- Basic caching → Advanced caching strategies
- Basic observability → Enhanced observability
- No session management → Session management
- No performance optimizations → Performance optimizations
- No GraphQL → Optional GraphQL API

**No Throw-Away Code:**

- All POC-2 code carries forward
- Same patterns used in POC-3
- Incremental updates
- Migration strategies for databases and event hub

---

## 16. Related Documents

- [`../POC-2-Implementation/project-rules.md`](../POC-2-Implementation/project-rules.md) - POC-2 foundational rules
- [`../References/mfe-poc3-architecture.md`](../References/mfe-poc3-architecture.md) - POC-3 frontend architecture
- [`../References/backend-poc3-architecture.md`](../References/backend-poc3-architecture.md) - POC-3 backend architecture
- [`../References/fullstack-architecture.md`](../References/fullstack-architecture.md) - Full-stack architecture
- [`../adr/poc-3/`](../adr/poc-3/) - Architecture Decision Records for POC-3
- [`../adr/backend/poc-3/`](../adr/backend/poc-3/) - Backend Architecture Decision Records for POC-3

---

**Last Updated:** 2026-12-09  
**Status:** Authoritative - POC-3 Implementation Rules
