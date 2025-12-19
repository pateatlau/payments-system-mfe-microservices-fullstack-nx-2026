# ADR-0003: Use Module Federation v2

**Status:** Accepted  
**Date:** 2026-01-XX  
**Deciders:** Architecture Team  
**Context:** POC-0

---

## Context

POC-0 requires Module Federation for microfrontend architecture. Requirements:
- Runtime code sharing
- Independent deployments
- Shared dependencies
- Type-safe remotes
- Production-ready
- Future-proof

**Note:** For MFE, Module Federation v2 (BIMF) is the clear choice. For universal MFE (web + mobile), v2 is required because mobile (Re.Pack) only supports v2.

## Decision

Use Module Federation v2 (@module-federation/enhanced 0.21.6) for MFE platform.

## Alternatives Considered

### Option 1: Module Federation v1.5

- **Pros:**
  - Mature, stable
  - Extensive documentation
  - Large ecosystem
  - Proven in production
- **Cons:**
  - Legacy status (v2 is the future)
  - Missing advanced features
  - Less type-safe
  - Inconsistent with mobile (if we add mobile later)
- **Why Not:** v2 is the future standard with better features. v1.5 is legacy and will be deprecated. See `docs/mf-v1.5-vs-v2-comparison.md` for detailed analysis.

### Option 2: Module Federation v2 (Chosen)

- **Pros:**
  - Future-proof (v2 is the standard)
  - Advanced features (better than v1.5)
  - Type-safe remotes
  - Better architecture
  - Cross-bundler support
  - Consistent with mobile (if we add mobile later)
  - Production-ready
- **Cons:**
  - Newer than v1.5 (but stable)
  - Less ecosystem maturity than v1.5
- **Why Chosen:** v2 is the future standard with better features. Provides all required features and is future-proof.

## Trade-offs

- **Pros:**
  - Future-proof architecture
  - Better features than v1.5
  - Type-safe remotes
  - Consistent with mobile (if added later)
- **Cons:**
  - Newer than v1.5 (but stable)
  - Less ecosystem maturity than v1.5
- **Risks:**
  - Low risk - v2 is production-ready
  - Ecosystem may be smaller than v1.5 but growing

## Consequences

- **Positive:**
  - Future-proof architecture
  - Better features available
  - Type-safe remotes improve developer experience
  - Consistent with mobile (if added later)
- **Negative:**
  - May need to create more documentation/examples
  - Fewer community examples than v1.5
- **Neutral:**
  - Migration path exists if needed (unlikely)

## Related Decisions

- `docs/mfe-poc0-architecture.md` - Section 2.2 Technology Stack
- `docs/mfe-poc0-tech-stack.md` - Module Federation v2 details
- `docs/mf-v1.5-vs-v2-comparison.md` - Detailed comparison
- `docs/mf-v2-migration-analysis.md` - Migration analysis (for universal MFE)

---

**Last Updated:** 2026-01-XX

