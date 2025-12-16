# ADR-0003: Use TanStack Query

**Status:** Accepted  
**Date:** 2026-01-XX  
**Deciders:** Architecture Team  
**Context:** POC-1

---

## Context

POC-1 requires server state management for API data, caching, and synchronization. Requirements:
- Server state management (API data, caching)
- Works without backend (can use stubbed APIs in POC-1)
- No throw-away code (patterns carry forward to real backend)
- Production-ready
- TypeScript support
- Automatic caching
- Background updates
- Request deduplication

**Note:** In POC-1, we use stubbed payment APIs. In POC-2, we'll use real backend APIs (still stubbed payments, no actual PSP).

## Decision

Use TanStack Query 5.x for server state management in POC-1.

## Alternatives Considered

### Option 1: SWR

- **Pros:**
  - Lightweight
  - Simple API
  - Good TypeScript support
  - Good caching
- **Cons:**
  - Smaller ecosystem than TanStack Query
  - Less features than TanStack Query
  - Less mature
- **Why Not:** TanStack Query provides more features and better ecosystem. SWR is good but TanStack Query is the industry standard.

### Option 2: Apollo Client (GraphQL)

- **Pros:**
  - Excellent for GraphQL
  - Good caching
  - Good TypeScript support
- **Cons:**
  - GraphQL-specific (we're using REST in POC-1)
  - Overkill for REST APIs
  - Larger bundle size
- **Why Not:** GraphQL-specific. We're using REST APIs. Apollo Client is overkill for REST.

### Option 3: Custom Hooks

- **Pros:**
  - Full control
  - No dependencies
  - Customized to our needs
- **Cons:**
  - Need to implement caching
  - Need to implement background updates
  - Need to implement request deduplication
  - More code to maintain
  - Higher risk of bugs
- **Why Not:** Too much work to implement features that TanStack Query provides out of the box. Higher risk of bugs.

### Option 4: TanStack Query (Chosen)

- **Pros:**
  - Server state management (designed for API data, caching, synchronization)
  - Works without backend (can use stubbed APIs in POC-1)
  - No throw-away code (patterns carry forward to real backend)
  - Production-ready (industry standard)
  - Excellent TypeScript support
  - Automatic caching
  - Background updates
  - Request deduplication
  - Optimistic updates
  - Error handling and retries
  - DevTools for debugging
  - Large ecosystem
  - Used by major companies
- **Cons:**
  - Learning curve (but worth it)
- **Why Chosen:** Best solution for server state management. Provides all required features with excellent developer experience.

## Trade-offs

- **Pros:**
  - Excellent server state management
  - No throw-away code (patterns carry forward)
  - Production-ready
  - Excellent developer experience
- **Cons:**
  - Learning curve (but worth it)
- **Risks:**
  - Low risk - TanStack Query is production-ready and widely used
  - Team needs to learn TanStack Query patterns

## Consequences

- **Positive:**
  - Excellent server state management
  - No throw-away code (patterns carry forward to real backend)
  - Better developer experience (DevTools, caching, background updates)
  - Production-ready
- **Negative:**
  - Team needs to learn TanStack Query patterns
- **Neutral:**
  - Can migrate to other solutions if needed (unlikely)

## Related Decisions

- `docs/mfe-poc1-architecture.md` - Section 7.3 TanStack Query for Server State
- `docs/mfe-poc1-tech-stack.md` - TanStack Query 5.x details
- `docs/react-query-decision.md` - Detailed decision analysis
- ADR-0002: Use Zustand for State Management

---

**Last Updated:** 2026-01-XX

