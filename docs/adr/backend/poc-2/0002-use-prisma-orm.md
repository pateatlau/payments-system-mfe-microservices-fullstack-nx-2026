# ADR-0002: Use Prisma ORM

**Status:** Accepted  
**Date:** 2026-01-XX  
**Context:** Backend POC-2 - Database ORM Selection  
**Decision Makers:** Backend Team

---

## Context

We need to choose an ORM (Object-Relational Mapping) library for database access in our Node.js backend. The ORM will be used across all microservices to interact with PostgreSQL. This decision affects type safety, developer experience, migration management, and database query performance.

**Requirements:**

- Type-safe database access
- Excellent TypeScript support
- Migration management
- Good developer experience
- Production-ready
- Works well with PostgreSQL
- Active maintenance

---

## Decision

We will use **Prisma 5.x** as the ORM for all backend services.

**Rationale:**

- **Type-safe** - Generated TypeScript types from schema
- **Excellent DX** - Great developer experience, Prisma Studio
- **Migrations** - Type-safe migrations, easy to manage
- **Performance** - Optimized queries, connection pooling
- **Production-ready** - Used by major companies
- **PostgreSQL support** - Excellent PostgreSQL support
- **Active maintenance** - Regularly updated, active development

---

## Alternatives Considered

### 1. TypeORM

**Pros:**
- More features (decorators, relations, etc.)
- Active development
- Good TypeScript support
- Works with multiple databases

**Cons:**
- More complex than Prisma
- Steeper learning curve
- Less type-safe than Prisma
- Migration management can be complex
- More boilerplate code

**Decision:** Not chosen - Prisma's type safety and DX outweigh TypeORM's additional features.

---

### 2. Sequelize

**Pros:**
- Mature and stable
- Large ecosystem
- Good documentation
- Works with multiple databases

**Cons:**
- Less type-safe than Prisma
- Older API (callback-based, though supports Promises)
- Less modern than Prisma
- Migration management can be complex
- Less TypeScript support

**Decision:** Not chosen - Prisma's modern approach and type safety are more valuable.

---

### 3. Raw SQL / Query Builders (Knex.js, pg)

**Pros:**
- Full control over queries
- Maximum performance
- No ORM overhead
- Direct SQL access

**Cons:**
- No type safety
- More boilerplate code
- Manual migration management
- Less developer-friendly
- Higher maintenance burden

**Decision:** Not chosen - Type safety and developer experience are more important than raw performance for POC-2.

---

## Trade-offs

### Pros

- ✅ **Type Safety** - Generated types from schema, compile-time errors
- ✅ **Developer Experience** - Prisma Studio, excellent tooling
- ✅ **Migrations** - Type-safe migrations, easy to manage
- ✅ **Performance** - Optimized queries, connection pooling
- ✅ **Production-ready** - Used by major companies
- ✅ **PostgreSQL Support** - Excellent PostgreSQL support

### Cons

- ⚠️ **Learning Curve** - Need to learn Prisma schema syntax (but minimal)
- ⚠️ **Flexibility** - Less flexible than raw SQL (but sufficient for our needs)
- ⚠️ **Performance** - Slight overhead compared to raw SQL (but negligible)

---

## Consequences

### Positive

- ✅ **Type Safety** - Catch database errors at compile time
- ✅ **Developer Experience** - Prisma Studio, excellent tooling
- ✅ **Migrations** - Easy to manage database schema changes
- ✅ **Code Quality** - Type-safe queries reduce bugs
- ✅ **Productivity** - Faster development with generated types

### Negative

- ⚠️ **Learning Curve** - Team needs to learn Prisma (but minimal)
- ⚠️ **Flexibility** - Some complex queries may need raw SQL (but rare)

### Neutral

- 🔄 **Migration Path** - Can use raw SQL when needed (Prisma supports it)
- 🔄 **Performance** - Prisma performance is excellent for our needs

---

## Implementation Notes

- Use Prisma 5.x (latest stable)
- Define schema in `schema.prisma`
- Use Prisma Client for database access
- Use Prisma Migrate for migrations
- Use Prisma Studio for database inspection
- Follow Prisma best practices

**Example:**

```prisma
// schema.prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String
  role  UserRole
}

enum UserRole {
  ADMIN
  CUSTOMER
  VENDOR
}
```

```typescript
// Usage
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

---

## Related Decisions

- **ADR-0003: Shared Database Strategy** - Prisma works well with shared database
- **ADR-0001: Use Express Framework** - Prisma works independently of Express
- Frontend uses TanStack Query (independent decision)

---

## References

- [Prisma Official Documentation](https://www.prisma.io/docs)
- `docs/backend-poc2-tech-stack.md` - Complete tech stack documentation
- `docs/backend-poc2-architecture.md` - Architecture documentation

---

**Last Updated:** 2026-01-XX

