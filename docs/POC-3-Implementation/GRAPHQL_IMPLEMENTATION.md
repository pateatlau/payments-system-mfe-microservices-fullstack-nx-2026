# GraphQL API Implementation - Complete Documentation

**Date:** 2025-12-11  
**Last Updated:** 2025-12-12  
**Status:** ✅ COMPLETE  
**Task:** Sub-task 8.5.1: Implement GraphQL API

> **Note:** GraphQL was initially marked as "Optional" but was later promoted to a core feature. This document covers the complete implementation, issues encountered, and all fixes applied.

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Summary](#implementation-summary)
3. [Architecture](#architecture)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Issues Encountered](#issues-encountered)
7. [Fixes Applied](#fixes-applied)
8. [Testing & Verification](#testing--verification)
9. [Usage Examples](#usage-examples)
10. [Lessons Learned](#lessons-learned)

---

## Overview

GraphQL API was implemented alongside the existing REST API in POC-3 to provide:

- **Flexible Querying**: Clients request exactly the data they need
- **Reduced Over-Fetching**: More efficient than REST for complex queries
- **Type Safety**: GraphQL schema provides compile-time type safety
- **Real-Time Subscriptions**: Placeholder for future WebSocket integration
- **Unified API**: Single endpoint (`/graphql`) for all GraphQL operations

**Decision:** GraphQL is implemented as an **optional alternative** to REST, not a replacement. Both APIs coexist and share the same authentication, authorization, and backend services.

---

## Implementation Summary

### Backend Components

1. **GraphQL Schema** (`apps/api-gateway/src/graphql/schema.ts`)
   - Type definitions (User, Payment, Profile, AuditLog, SystemConfig)
   - Query definitions (me, payment, payments, profile, users, etc.)
   - Mutation definitions (login, register, createPayment, updatePayment, etc.)
   - Subscription definitions (placeholder for real-time updates)
   - Custom directives (`@auth`, `@admin`) for declarative authorization
   - Custom scalars (`DateTime`, `JSON`)

2. **GraphQL Resolvers** (`apps/api-gateway/src/graphql/resolvers/index.ts`)
   - Resolver functions that proxy to existing REST microservices
   - Error handling with GraphQL error format
   - Authentication context extraction
   - Scalar type handling (DateTime, JSON)

3. **GraphQL Directives** (`apps/api-gateway/src/graphql/directives.ts`)
   - `@auth` directive: Requires authentication
   - `@admin` directive: Requires ADMIN role
   - Schema transformation using `@graphql-tools/utils`

4. **GraphQL Context** (`apps/api-gateway/src/graphql/context.ts`)
   - Extracts JWT token from request headers
   - Provides authenticated user information to resolvers

5. **Apollo Server** (`apps/api-gateway/src/graphql/server.ts`)
   - Apollo Server v5 configuration
   - Express middleware integration
   - Logging plugin
   - Schema creation with directive transformers

### Frontend Components

1. **Shared GraphQL Client Library** (`libs/shared-graphql-client/`)
   - Apollo Client v4 setup
   - JWT authentication integration
   - Error handling and retry logic
   - InMemoryCache configuration
   - React `GraphQLProvider` component

2. **GraphQL Hooks** (`apps/payments-mfe/src/hooks/usePaymentsGraphQL.ts`)
   - React hooks for payment queries and mutations
   - Type-safe GraphQL operations
   - Integration with Apollo Client

3. **Module Federation Configuration** (`apps/payments-mfe/rspack.config.js`)
   - Module aliases for shared GraphQL client
   - Shared dependencies (Apollo Client, GraphQL)

---

## Architecture

### GraphQL Request Flow

```
Client Request
    ↓
Express Middleware (optionalAuth)
    ↓
Apollo Server Middleware (/graphql)
    ↓
GraphQL Context Creation (extract JWT, user)
    ↓
Directive Validation (@auth, @admin)
    ↓
Resolver Execution
    ↓
Backend Service Proxy (Auth, Payments, Admin, Profile)
    ↓
Response Transformation
    ↓
GraphQL Response
```

### Schema Structure

```
Schema
├── Scalars (DateTime, JSON)
├── Enums (UserRole, PaymentStatus, PaymentType)
├── Types
│   ├── User
│   ├── Payment
│   ├── Profile
│   ├── AuthResponse
│   ├── PaymentConnection (pagination)
│   ├── AuditLog
│   └── SystemConfig
├── Input Types
│   ├── LoginInput
│   ├── RegisterInput
│   ├── CreatePaymentInput
│   └── UpdatePaymentInput
├── Query (read operations)
├── Mutation (write operations)
└── Subscription (real-time, placeholder)
```

### Directive System

**@auth Directive:**

- Applied to fields requiring authentication
- Checks for `context.user` (JWT payload)
- Throws `UNAUTHENTICATED` error if missing

**@admin Directive:**

- Applied to fields requiring ADMIN role
- Checks for `context.user.role === 'ADMIN'`
- Throws `FORBIDDEN` error if not admin

**Implementation:**

- Directives declared in schema: `directive @auth on FIELD_DEFINITION`
- Directives implemented via schema transformers
- Transformers wrap resolver functions with auth checks

---

## Backend Implementation

### Dependencies Installed

```json
{
  "@apollo/server": "^5.0.0",
  "@as-integrations/express4": "^1.0.0",
  "@graphql-tools/schema": "^10.0.30",
  "@graphql-tools/utils": "^10.11.0",
  "graphql": "^16.12.0",
  "graphql-tag": "^2.12.6"
}
```

### Key Files

**1. Schema Definition** (`apps/api-gateway/src/graphql/schema.ts`)

```typescript
export const typeDefs = gql`
  # Custom Directive Declarations
  directive @auth on FIELD_DEFINITION
  directive @admin on FIELD_DEFINITION

  # Scalars
  scalar DateTime
  scalar JSON

  # Types, Queries, Mutations, Subscriptions...
`;
```

**2. Resolvers** (`apps/api-gateway/src/graphql/resolvers/index.ts`)

- Proxies to backend services using Axios
- Handles authentication headers
- Transforms REST responses to GraphQL format
- Implements scalar resolvers (DateTime, JSON)

**3. Server Setup** (`apps/api-gateway/src/graphql/server.ts`)

```typescript
function createSchema() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    assumeValidSDL: true, // Critical for custom directives
  });
  return authDirectiveTransformer(adminDirectiveTransformer(schema));
}
```

**4. API Gateway Integration** (`apps/api-gateway/src/main.ts`)

- GraphQL middleware applied at `/graphql`
- `optionalAuth` middleware extracts JWT (if present)
- Apollo Server graceful shutdown on SIGTERM

---

## Frontend Implementation

### Shared GraphQL Client Library

**Location:** `libs/shared-graphql-client/`

**Key Files:**

- `src/lib/graphql-client.ts`: Apollo Client setup
- `src/lib/graphql-provider.tsx`: React provider component
- `src/lib/queries.ts`: GraphQL query documents
- `src/lib/mutations.ts`: GraphQL mutation documents

**Apollo Client Configuration:**

```typescript
const client = new ApolloClient({
  link: createHttpLink({
    uri: graphqlUrl,
  }),
  cache: new InMemoryCache({
    typePolicies: {
      // Cache configuration
    },
  }),
});
```

### Payments MFE Integration

**Bootstrap** (`apps/payments-mfe/src/bootstrap.tsx`):

```typescript
const graphqlClient = createGraphQLClient({
  url: process.env['NX_GRAPHQL_URL'] || 'http://localhost:3000/graphql',
  getAccessToken: () => authStore.getState().accessToken || '',
});

<GraphQLProvider client={graphqlClient}>
  {/* App components */}
</GraphQLProvider>
```

**Rspack Configuration** (`apps/payments-mfe/rspack.config.js`):

```javascript
resolve: {
  alias: {
    '@payments-system/shared-graphql-client': path.resolve(__dirname, '../../libs/shared-graphql-client/src'),
  },
},
ModuleFederationPlugin: {
  sharedDependencies: {
    '@apollo/client': { singleton: true },
    'graphql': { singleton: true },
    '@payments-system/shared-graphql-client': { singleton: true },
  },
},
```

---

## Issues Encountered

### Issue 1: Unknown Directive Errors on Startup

**Error:**

```
Error: Unknown directive "@auth".
Unknown directive "@admin".
```

**Root Cause:**

- `makeExecutableSchema` from `@graphql-tools/schema` validates SDL (Schema Definition Language) by default
- Custom directives (`@auth`, `@admin`) are declared in the schema but implemented via schema transformers
- The transformers run AFTER schema creation, so validation fails because GraphQL doesn't recognize the directives during SDL validation

**Impact:**

- API Gateway crashed immediately on startup
- GraphQL endpoint was completely unavailable
- All GraphQL functionality non-functional

**Solution:**

- Added `assumeValidSDL: true` to `makeExecutableSchema()` options
- This skips SDL validation for custom directives that are implemented via transformers
- Moved schema creation into a dedicated `createSchema()` function for better organization

**Fix Applied:**

```typescript
function createSchema() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    // Skip SDL validation for custom directives
    // The directives are declared but implemented via transformers
    assumeValidSDL: true,
  });
  return authDirectiveTransformer(adminDirectiveTransformer(schema));
}
```

**Commit:** `b4e8033` - `fix(api-gateway): Fix GraphQL directive validation errors`

---

### Issue 2: Module Not Found in Payments MFE

**Error:**

```
Module not found: Can't resolve '@payments-system/shared-graphql-client'
```

**Root Cause:**

- Rspack bundler couldn't resolve the shared GraphQL client library path
- Module Federation wasn't configured to share GraphQL dependencies

**Impact:**

- Payments MFE failed to build/start
- GraphQL client unavailable in frontend

**Solution:**

- Added module alias in `rspack.config.js` for the shared library
- Added `@apollo/client`, `graphql`, and `@payments-system/shared-graphql-client` to `sharedDependencies` in Module Federation config

**Fix Applied:**

```javascript
resolve: {
  alias: {
    '@payments-system/shared-graphql-client': path.resolve(__dirname, '../../libs/shared-graphql-client/src'),
  },
},
ModuleFederationPlugin: {
  sharedDependencies: {
    '@apollo/client': { singleton: true },
    'graphql': { singleton: true },
    '@payments-system/shared-graphql-client': { singleton: true },
  },
},
```

---

### Issue 3: TypeScript Type Errors

**Multiple TypeScript Errors:**

- `TS2554: Expected 4 arguments, but got 3` for `getDirective` calls
- `TS2322: Type 'ApolloClient<any>' is not generic` (Apollo Client v4)
- `TS2339: Property 'payments' does not exist on type '{}'` in hooks

**Root Cause:**

- Version mismatches between Apollo Client v3 and v4 APIs
- Type inference issues with Apollo Client hooks
- `@graphql-tools/utils` type definitions expecting different signatures

**Solutions:**

1. **Directive Type Errors:**
   - Added `as any` type assertions to `getDirective` calls
   - Added `info` parameter to `fieldConfig.resolve` functions

2. **Apollo Client v4 Compatibility:**
   - Removed generic type parameters from `ApolloClient` instances
   - Changed `ApolloProvider` import from `@apollo/client` to `@apollo/client/react`

3. **Type Inference in Hooks:**
   - Added explicit type assertions to `data` objects returned by Apollo Client hooks
   - Example: `(data as { payments?: { edges?: Array<{ node: Payment }> } })?.payments`

---

### Issue 4: DateTime Scalar Type Errors

**Error:**

```
TS2322: Type 'string' is not assignable to type 'Date'
TS2322: Type 'Date' is not assignable to type 'string'
```

**Root Cause:**

- DateTime scalar resolvers had incorrect return types
- `parseValue` should return `Date`, `serialize` should return `string`

**Solution:**

- Fixed return types in DateTime scalar resolvers
- Added proper type checking and error handling

**Fix Applied:**

```typescript
DateTime: {
  parseValue: (value: unknown): Date => {
    if (typeof value === 'string') return new Date(value);
    if (value instanceof Date) return value;
    throw new GraphQLError('Invalid DateTime value');
  },
  serialize: (value: unknown): string => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    throw new GraphQLError('Invalid DateTime value');
  },
},
```

---

### Issue 5: Subscription Resolver Type Errors

**Error:**

```
TS2353: Object literal may only specify known properties, and 'subscribe' does not exist
```

**Root Cause:**

- Apollo Server v5 expects subscription resolvers to be async generator functions (`async function*`)
- Previous implementation used object with `subscribe` method (Apollo Server v3 pattern)

**Solution:**

- Changed subscription resolvers to async generator functions
- Throws `NOT_IMPLEMENTED` error (placeholders for future WebSocket integration)

**Fix Applied:**

```typescript
Subscription: {
  paymentUpdated: async function* (
    _parent: unknown,
    _args: { userId: string },
    _context: GraphQLContext
  ): AsyncIterable<unknown> {
    throw new GraphQLError('Subscriptions not yet implemented', {
      extensions: { code: 'NOT_IMPLEMENTED' },
    });
  },
},
```

---

## Fixes Applied

### Summary of All Fixes

1. **Schema Validation Fix** (Critical)
   - Added `assumeValidSDL: true` to `makeExecutableSchema()`
   - Fixed API Gateway startup crash

2. **Module Resolution Fix**
   - Added Rspack alias for shared GraphQL client
   - Configured Module Federation shared dependencies

3. **TypeScript Type Fixes**
   - Fixed directive transformer type assertions
   - Fixed Apollo Client v4 compatibility
   - Fixed type inference in hooks

4. **Scalar Type Fixes**
   - Fixed DateTime scalar return types
   - Added proper error handling

5. **Subscription Resolver Fixes**
   - Changed to async generator functions
   - Added placeholder implementation

### Files Modified

1. `apps/api-gateway/src/graphql/schema.ts`
   - Added directive declarations

2. `apps/api-gateway/src/graphql/server.ts`
   - Added `assumeValidSDL: true`
   - Refactored schema creation
   - Improved type assertions

3. `apps/api-gateway/src/graphql/directives.ts`
   - Fixed `getDirective` type assertions
   - Added `info` parameter to resolvers

4. `apps/api-gateway/src/graphql/resolvers/index.ts`
   - Fixed DateTime scalar resolvers
   - Fixed subscription resolvers

5. `libs/shared-graphql-client/src/lib/graphql-client.ts`
   - Fixed Apollo Client v4 compatibility
   - Removed generic type parameters

6. `libs/shared-graphql-client/src/lib/graphql-provider.tsx`
   - Fixed ApolloProvider import path

7. `apps/payments-mfe/src/hooks/usePaymentsGraphQL.ts`
   - Added type assertions for data objects

8. `apps/payments-mfe/rspack.config.js`
   - Added module alias
   - Added shared dependencies

---

## Testing & Verification

### Build Verification

✅ **API Gateway Build:**

```bash
npx nx build api-gateway
# Success: No errors
```

✅ **TypeScript Compilation:**

```bash
npx tsc --noEmit -p apps/api-gateway/tsconfig.app.json
# Success: No type errors
```

✅ **Schema Creation Test:**

```bash
node -e "const { typeDefs } = require('./dist/apps/api-gateway/apps/api-gateway/src/graphql/schema.js'); ..."
# Success: Schema created with 27 types
```

✅ **Apollo Server Creation Test:**

```bash
node -e "const { createApolloServer } = require('./dist/apps/api-gateway/apps/api-gateway/src/graphql/server.js'); ..."
# Success: Apollo Server created
```

### Runtime Verification

✅ **API Gateway Startup:**

```
info: GraphQL server started at /graphql
info: API Gateway started on port 3000 {..., "graphql":true, ...}
```

✅ **Unit Tests:**

```bash
npx nx test api-gateway --testFile="server.test.ts"
# PASS: 2/2 tests passed
```

### End-to-End Verification

✅ **Backend:**

- GraphQL endpoint accessible at `/graphql`
- Schema introspection works
- Queries and mutations execute successfully
- Authentication and authorization work via directives

✅ **Frontend:**

- GraphQL client library builds successfully
- Payments MFE integrates GraphQL client
- Module Federation shares dependencies correctly
- No build errors

---

## Usage Examples

### Backend: GraphQL Query

```graphql
query GetPayments {
  payments(input: { first: 10 }) {
    edges {
      node {
        id
        amount
        currency
        status
        createdAt
      }
    }
    totalCount
  }
}
```

### Backend: GraphQL Mutation

```graphql
mutation CreatePayment($input: CreatePaymentInput!) {
  createPayment(input: $input) {
    id
    amount
    status
    createdAt
  }
}
```

### Frontend: Using GraphQL Hooks

```typescript
import {
  usePaymentsGraphQL,
  useCreatePaymentGraphQL,
} from './hooks/usePaymentsGraphQL';

function PaymentsPage() {
  const { data, loading, error } = usePaymentsGraphQL({ first: 10 });
  const [createPayment] = useCreatePaymentGraphQL();

  const handleCreate = async () => {
    await createPayment({
      variables: {
        input: {
          amount: 100.0,
          currency: 'USD',
          type: 'PAYMENT',
        },
      },
    });
  };

  // Render UI...
}
```

### Direct cURL Example

```bash
# Query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query":"query { me { id email name role } }"}'

# Mutation
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(input: {email: \"user@example.com\", password: \"password\"}) { user { id email } accessToken } }"}'
```

---

## Lessons Learned

### 1. Custom Directives Require Special Handling

**Lesson:** When using custom GraphQL directives implemented via schema transformers, you must use `assumeValidSDL: true` in `makeExecutableSchema()` because:

- Directives are declared in SDL but implemented after schema creation
- SDL validation runs before transformers, so it doesn't recognize custom directives
- This is a common pattern with `@graphql-tools/utils`

**Best Practice:** Always use `assumeValidSDL: true` when implementing custom directives via transformers.

### 2. Apollo Client v4 Breaking Changes

**Lesson:** Apollo Client v4 removed generic type parameters from `ApolloClient` and changed import paths:

- `ApolloClient<Cache>` → `ApolloClient`
- `ApolloProvider` moved to `@apollo/client/react`

**Best Practice:** Check Apollo Client version and use correct API patterns.

### 3. Module Federation Requires Explicit Configuration

**Lesson:** When adding new shared libraries to Module Federation:

- Add module aliases in bundler config (Rspack/Webpack)
- Add to `sharedDependencies` to ensure singleton instances
- Test build and runtime to verify resolution

**Best Practice:** Always configure Module Federation for new shared libraries immediately.

### 4. Type Safety Requires Explicit Assertions

**Lesson:** Apollo Client hooks don't always infer types correctly, especially with complex nested queries:

- Use explicit type assertions for `data` objects
- Define proper TypeScript interfaces for GraphQL responses
- Consider using GraphQL Code Generator for type safety

**Best Practice:** Use GraphQL Code Generator in production for automatic type generation.

### 5. Schema Transformers Run After Schema Creation

**Lesson:** Understanding the order of operations is critical:

1. Schema is created from SDL
2. SDL validation runs (fails if custom directives not recognized)
3. Transformers run (implement custom directives)
4. Final schema is used by Apollo Server

**Best Practice:** Always use `assumeValidSDL: true` when transformers implement directives declared in SDL.

---

## Future Improvements

### 1. GraphQL Code Generator

**Recommendation:** Use GraphQL Code Generator to automatically generate TypeScript types from the schema:

- Eliminates manual type definitions
- Ensures type safety between schema and code
- Reduces maintenance burden

### 2. Subscription Implementation

**Current Status:** Subscriptions are placeholders (throw `NOT_IMPLEMENTED`)

**Future Work:**

- Integrate with WebSocket server
- Implement real-time event forwarding
- Add subscription examples

### 3. Query Complexity Limits

**Recommendation:** Add query complexity analysis to prevent expensive queries:

- Use `graphql-query-complexity` library
- Set maximum complexity threshold
- Reject queries that exceed limit

### 4. Depth Limiting

**Recommendation:** Add query depth limiting to prevent deeply nested queries:

- Use `graphql-depth-limit` library
- Set maximum depth (e.g., 10 levels)
- Reject queries that exceed limit

### 5. Caching Strategy

**Recommendation:** Implement GraphQL-specific caching:

- Use Apollo Server caching plugins
- Cache query results based on variables
- Invalidate cache on mutations

---

## Related Documentation

- **ADR-0003:** GraphQL API Decision (`docs/adr/backend/poc-3/0003-graphql-optional.md`)
- **Testing Guide:** GraphQL Tests (`docs/POC-3-Implementation/testing-guide.md`)
- **Task List:** Sub-task 8.5.1 (`docs/POC-3-Implementation/task-list.md`)
- **Implementation Plan:** Task 8.5 (`docs/POC-3-Implementation/implementation-plan.md`)

---

## Conclusion

The GraphQL API implementation is **complete and functional**. All critical issues have been resolved:

✅ GraphQL endpoint accessible at `/graphql`  
✅ Schema with all types, queries, and mutations  
✅ Authentication and authorization via directives  
✅ Frontend integration with Apollo Client  
✅ Module Federation configuration  
✅ TypeScript compilation without errors  
✅ Unit tests passing  
✅ API Gateway starts successfully

The implementation provides a solid foundation for GraphQL usage in POC-3 and can be evaluated for MVP inclusion.

---

**Last Updated:** 2025-12-12  
**Status:** ✅ Complete  
**Next Steps:** Evaluate GraphQL usage patterns in POC-3 to decide on MVP inclusion
