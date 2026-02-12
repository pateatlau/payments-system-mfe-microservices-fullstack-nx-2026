# Module Federation Shared Dependencies Security Model

**Status:** Documented
**Version:** 1.0
**Date:** February 12, 2026
**Phase:** Phase 6 - Module Federation Security

## Overview

This document details the security model for shared dependencies in the Module Federation architecture. Proper configuration of shared dependencies is critical for:

1. **Singleton Guarantees** - Ensuring only one instance of critical libraries
2. **State Isolation** - Preventing unauthorized access to sensitive data
3. **Security Controls** - Maintaining consistent security measures across MFEs

## Shared Dependencies Audit

### Shell (Host) Configuration

The shell acts as the Module Federation host and defines the canonical shared dependency configuration.

| Dependency | Singleton | Eager | Security Concern |
|------------|-----------|-------|------------------|
| `react` | ✅ Yes | ❌ No | Multiple React instances cause hooks to fail |
| `react-dom` | ✅ Yes | ❌ No | Must match React version |
| `@tanstack/react-query` | ✅ Yes | ❌ No | Single cache instance required |
| `zustand` | ✅ Yes | ❌ No | Required for shared-auth-store singleton |
| `react-hook-form` | ✅ Yes | ❌ No | Form state management |
| `shared-auth-store` | ✅ Yes | ❌ No | **CRITICAL**: Auth state must be singleton |
| `@mfe/shared-api-client` | ✅ Yes | ❌ No | **CRITICAL**: Token provider must be singleton |
| `shared-api-client` | ✅ Yes | ❌ No | Alias for above |
| `@mfe/shared-design-system` | ✅ Yes | ❌ No | UI consistency |
| `@mfe/shared-theme-store` | ✅ Yes | ❌ No | Theme state singleton |
| `@mfe/shared-session-sync` | ✅ Yes | ❌ No | Cross-tab session sync |
| `shared-session-sync` | ✅ Yes | ❌ No | Alias for above |
| `shared-types` | ✅ Yes | ❌ No | Type definitions |
| `shared-websocket` | ✅ Yes | ❌ No | WebSocket connection singleton |

### Remote MFE Configurations

Each remote MFE MUST have matching shared dependency configurations for security-critical libraries.

#### Auth MFE
- ✅ `shared-auth-store` - singleton: true
- ⚠️ Missing: `@mfe/shared-api-client` - should be added
- ⚠️ Missing: `shared-types` - should be added

#### Payments MFE
- ✅ `shared-auth-store` - singleton: true
- ✅ `@mfe/shared-api-client` - singleton: true
- ✅ `shared-api-client` - singleton: true
- ✅ `shared-types` - singleton: true
- ✅ Additional: `@apollo/client`, `graphql` - singleton: true

#### Admin MFE
- ✅ `shared-auth-store` - singleton: true
- ⚠️ Missing: `@mfe/shared-api-client` - should be added
- ⚠️ Missing: `shared-types` - should be added
- ⚠️ Uses `eager: true` - only appropriate for standalone mode

#### Profile MFE
- ✅ `shared-auth-store` - singleton: true
- ⚠️ Missing: `@mfe/shared-api-client` - should be added
- ⚠️ Missing: `shared-types` - should be added
- ⚠️ Uses `eager: true` - only appropriate for standalone mode

## Security-Critical Shared Libraries

### 1. shared-auth-store (CRITICAL)

**Purpose:** Manages authentication state across all MFEs.

**Sensitive Data:**
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `user` - User profile information
- `mfaToken` - Temporary MFA token during login

**Security Controls:**
- ✅ Singleton ensures single source of truth
- ✅ Tokens stored in memory (not localStorage for sensitive operations)
- ✅ Persist middleware only saves specific fields
- ✅ EventBus notifications for state changes
- ⚠️ Note: Currently persists tokens to localStorage (see Task 7.1)

**Why Singleton is Critical:**
Without singleton configuration, each MFE would have its own auth store instance. This would mean:
- Login in auth-mfe wouldn't update shell's auth state
- Protected routes in other MFEs wouldn't see authenticated state
- Token refresh in one MFE wouldn't update others
- Security: Multiple token instances increase attack surface

### 2. @mfe/shared-api-client (CRITICAL)

**Purpose:** Provides authenticated HTTP client for API calls.

**Sensitive Data:**
- Token provider reference (provides access to auth tokens)
- Axios interceptors for token injection
- CSRF token management

**Security Controls:**
- ✅ Singleton ensures single token provider
- ✅ Automatic token refresh on 401
- ✅ CSRF token injection for mutating requests
- ✅ Centralized error handling

**Why Singleton is Critical:**
Without singleton configuration:
- Multiple axios instances with separate interceptors
- Token refresh could race condition between instances
- CSRF tokens might not sync across instances

### 3. shared-websocket (CRITICAL)

**Purpose:** Manages WebSocket connection for real-time updates.

**Sensitive Data:**
- Authentication token for WebSocket connection
- Connection state

**Security Controls:**
- ✅ Singleton ensures single WebSocket connection
- ✅ Token-based authentication
- ✅ Reconnection handling

### 4. shared-session-sync (HIGH)

**Purpose:** Synchronizes session state across browser tabs.

**Security Controls:**
- ✅ Uses BroadcastChannel API (same-origin only)
- ✅ Singleton ensures consistent state

## Data Flow Security Analysis

### Authentication Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Auth MFE   │     │ shared-auth-store│     │  Other MFEs     │
│  (SignIn)   │────▶│   (singleton)    │────▶│ (read state)    │
└─────────────┘     └──────────────────┘     └─────────────────┘
      │                      │
      │                      ▼
      │              ┌──────────────────┐
      │              │ shared-api-client│
      │              │   (singleton)    │
      │              └──────────────────┘
      │                      │
      ▼                      ▼
┌─────────────────────────────────────────┐
│            API Gateway                   │
│  (validates JWT, applies rate limits)    │
└─────────────────────────────────────────┘
```

### Potential Data Leak Vectors

| Vector | Risk | Mitigation |
|--------|------|------------|
| Cross-MFE store access | LOW | All MFEs share same store instance (by design) |
| Browser DevTools | MEDIUM | Tokens visible in memory; use HttpOnly cookies (Task 7.1) |
| EventBus events | LOW | Events don't include raw tokens, only user info |
| localStorage | MEDIUM | Tokens persisted; will migrate to HttpOnly cookies |
| Console logging | LOW | Sensitive data not logged in production |

## Verification Checklist

### Build-Time Verification

1. **Singleton Configuration** - All security-critical libs must have `singleton: true`
2. **Version Alignment** - `requiredVersion` should match or be `false`
3. **Eager Loading** - Only use `eager: true` for standalone MFE mode

### Runtime Verification

```javascript
// Verify singleton instances in browser console
// Should return same instance across all MFE contexts
window.__FEDERATION__.__INSTANCES__

// Verify auth store is singleton
// Compare store instance between shell and remote MFE
```

### Test Scenarios

1. **Login State Sync**
   - Login in auth-mfe
   - Verify shell shows authenticated state
   - Verify other MFEs can access protected routes

2. **Token Refresh**
   - Trigger token refresh from any MFE
   - Verify all MFEs use new token

3. **Logout State Sync**
   - Logout from any MFE
   - Verify all MFEs show logged-out state

4. **Cross-MFE API Calls**
   - Make authenticated API call from payments-mfe
   - Verify same token is used as in auth-mfe

## Recommendations

### Immediate Actions (Phase 6)

1. ✅ Document shared dependency security model (this document)
2. ⚠️ Add missing `@mfe/shared-api-client` to auth-mfe, admin-mfe, profile-mfe
3. ⚠️ Add missing `shared-types` to auth-mfe, admin-mfe, profile-mfe
4. ✅ Ensure all MFEs have matching singleton configurations

### Phase 7 Actions

1. Migrate tokens from localStorage to HttpOnly cookies (Task 7.1)
2. Remove token persistence from zustand persist middleware (Task 7.2)
3. Implement session fingerprinting (Task 7.3)

## Appendix: Full Shared Dependencies Configuration

### Recommended Standard Configuration

All MFEs should use this configuration for security-critical dependencies:

```javascript
const securityCriticalDependencies = {
  // Auth store - MUST be singleton
  'shared-auth-store': {
    singleton: true,
    requiredVersion: false,
    eager: false, // Set to true only for standalone MFE mode
  },
  // API client - MUST be singleton for token management
  '@mfe/shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  // Session sync - MUST be singleton for cross-tab sync
  '@mfe/shared-session-sync': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-session-sync': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  // WebSocket - MUST be singleton for single connection
  'shared-websocket': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  // Theme store - singleton for consistent theming
  '@mfe/shared-theme-store': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  // Types - singleton for type consistency
  'shared-types': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
};
```

---

**Last Updated:** February 12, 2026
**Author:** Security Hardening Team
**Related Tasks:** Phase 6 Task 6.6, Phase 7 Tasks 7.1-7.5
