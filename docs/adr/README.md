# Architecture Decision Records (ADR)

**Purpose:** This directory contains Architecture Decision Records (ADRs) documenting important architectural decisions made during the development of the MFE Platform.

**What are ADRs?**

ADRs capture the decision-making process, including:

- Context and requirements
- Alternatives considered
- Trade-offs
- Consequences
- Related decisions

**How ADRs Complement Other Documentation:**

- **Architecture Docs:** Describe "what" and "how"
- **Tech Stack Docs:** Describe "what technologies" and "why"
- **ADRs:** Capture "what alternatives were considered" and "trade-offs"

---

## ADR Index by Phase

### POC-0: Foundation

- [ADR-0001: Use Nx Monorepo](./poc-0/0001-use-nx-monorepo.md)
- [ADR-0002: Use Vite Bundler](./poc-0/0002-use-vite-bundler.md)
- [ADR-0003: Use Module Federation v2](./poc-0/0003-use-module-federation-v2.md)
- [ADR-0004: Use Vitest for Testing](./poc-0/0004-use-vitest-for-testing.md)
- [ADR-0005: Use Playwright for E2E Testing](./poc-0/0005-use-playwright-for-e2e.md)

### POC-1: Authentication & Payments

- [ADR-0001: Use React Router 7](./poc-1/0001-use-react-router-7.md)
- [ADR-0002: Use Zustand for State Management](./poc-1/0002-use-zustand-for-state.md)
- [ADR-0003: Use TanStack Query](./poc-1/0003-use-tanstack-query.md)
- [ADR-0004: Use Tailwind CSS v4](./poc-1/0004-use-tailwind-css-v4.md)
- [ADR-0005: Shared Zustand Stores in POC-1](./poc-1/0005-shared-zustand-stores-poc1.md)

### POC-2: Backend Integration & Design System

- [ADR-0001: Event Bus for Inter-MFE Communication](./poc-2/0001-event-bus-for-inter-mfe-comm.md)
- [ADR-0002: Use shadcn/ui Design System](./poc-2/0002-use-shadcn-ui-design-system.md)
- [ADR-0003: Backend API Integration Strategy](./poc-2/0003-backend-api-integration-strategy.md)
- [ADR-0004: Basic Observability Approach](./poc-2/0004-basic-observability-approach.md)

### POC-2: Backend Integration & Design System

- [ADR-0001: Event Bus for Inter-MFE Communication](./poc-2/0001-event-bus-for-inter-mfe-comm.md)
- [ADR-0002: Use shadcn/ui Design System](./poc-2/0002-use-shadcn-ui-design-system.md)

### POC-2: Backend

- [ADR-0001: Use Express Framework](./backend/poc-2/0001-use-express-framework.md)
- [ADR-0002: Use Prisma ORM](./backend/poc-2/0002-use-prisma-orm.md)
- [ADR-0003: Shared Database Strategy](./backend/poc-2/0003-shared-database-strategy.md)
- [ADR-0004: Redis Pub/Sub for Event Hub](./backend/poc-2/0004-redis-pubsub-event-hub.md)
- [ADR-0005: JWT Authentication](./backend/poc-2/0005-jwt-authentication.md)

### POC-3: Infrastructure & Advanced Features

- [ADR-0001: nginx Reverse Proxy](./poc-3/0001-nginx-reverse-proxy.md)
- [ADR-0002: WebSocket for Real-Time](./poc-3/0002-websocket-for-realtime.md)

### POC-3: Backend

- [ADR-0001: RabbitMQ for Production Event Hub](./backend/poc-3/0001-rabbitmq-event-hub.md)
- [ADR-0002: nginx Reverse Proxy](./backend/poc-3/0002-nginx-reverse-proxy.md)
- [ADR-0003: GraphQL API (Optional)](./backend/poc-3/0003-graphql-optional.md)
- [ADR-0004: Separate Databases per Service](./backend/poc-3/0004-separate-databases-per-service.md)

---

## ADR Status Legend

- **Proposed:** Decision is being considered
- **Accepted:** Decision has been made and implemented
- **Deprecated:** Decision is no longer valid
- **Superseded:** Decision has been replaced by another ADR

---

## Related Documentation

- [ADR Recommendation](../../adr-recommendation.md) - Why ADRs and structure recommendation
- [POC-0 Architecture](../mfe-poc0-architecture.md)
- [POC-1 Architecture](../mfe-poc1-architecture.md)
- [POC-2 Architecture](../mfe-poc2-architecture.md)
- [POC-3 Architecture](../mfe-poc3-architecture.md)
- [POC-0 Tech Stack](../mfe-poc0-tech-stack.md)
- [POC-1 Tech Stack](../mfe-poc1-tech-stack.md)
- [POC-2 Tech Stack](../mfe-poc2-tech-stack.md)
- [POC-3 Tech Stack](../mfe-poc3-tech-stack.md)

---

**Last Updated:** 2026-01-XX
