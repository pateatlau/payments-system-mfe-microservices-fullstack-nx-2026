# ADR-0004: Use Vitest for Testing

**Status:** Accepted  
**Date:** 2026-01-XX  
**Deciders:** Architecture Team  
**Context:** POC-0

---

## Context

POC-0 requires a testing framework for unit and integration testing. Requirements:
- Fast execution
- TypeScript support
- Vite-native (works seamlessly with Vite)
- Modern tooling
- Good developer experience
- Production-ready

## Decision

Use Vitest 2.0.x for unit and integration testing in MFE platform.

## Alternatives Considered

### Option 1: Jest

- **Pros:**
  - Mature, battle-tested
  - Large ecosystem
  - Extensive documentation
  - Widely used
  - Good TypeScript support
- **Cons:**
  - Slower than Vitest
  - Not Vite-native (requires configuration)
  - More complex setup
  - Larger bundle size
- **Why Not:** Vitest is faster, Vite-native, and provides better developer experience. Jest is good but not optimized for Vite projects.

### Option 2: Vitest (Chosen)

- **Pros:**
  - Fast execution (ESM-first, Vite-powered, parallel execution)
  - Better TypeScript support (native ESM, better type checking)
  - Modern tooling (built for modern JavaScript/TypeScript)
  - Better DX (faster feedback, better error messages)
  - Vite-native (works seamlessly with Vite)
  - Smaller bundle (more lightweight than Jest)
  - Production-ready
  - Used by major companies
  - Active maintenance
- **Cons:**
  - Newer than Jest (but mature enough)
  - Smaller ecosystem than Jest (but growing)
- **Why Chosen:** Best balance of performance, developer experience, and Vite integration. Provides all required features with excellent performance.

## Trade-offs

- **Pros:**
  - Fast test execution
  - Excellent developer experience
  - Vite-native integration
  - Modern tooling
- **Cons:**
  - Newer than Jest (but mature)
  - Smaller ecosystem than Jest (but growing)
- **Risks:**
  - Low risk - Vitest is production-ready and widely used
  - Ecosystem may be smaller than Jest but sufficient

## Consequences

- **Positive:**
  - Faster test execution
  - Better developer experience
  - Seamless Vite integration
  - Modern tooling
- **Negative:**
  - May need to create more documentation/examples
  - Fewer community examples than Jest
- **Neutral:**
  - Can migrate to Jest if needed (unlikely)

## Related Decisions

- `docs/mfe-poc0-architecture.md` - Section 18 Testing Strategy
- `docs/mfe-poc0-tech-stack.md` - Vitest 2.0.x details
- `docs/testing-framework-decision.md` - Detailed decision analysis
- ADR-0005: Use Playwright for E2E Testing

---

**Last Updated:** 2026-01-XX

