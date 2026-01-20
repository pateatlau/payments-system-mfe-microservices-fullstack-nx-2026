# Session Management - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Session Management system (Priority 7.3) implemented in the payments system backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Overview](#system-overview)
3. [Test Environment Setup](#test-environment-setup)
4. [Test Scenarios](#test-scenarios)
   - [Device Fingerprinting](#1-device-fingerprinting)
   - [Concurrent Session Limits](#2-concurrent-session-limits)
   - [Session Activity Tracking](#3-session-activity-tracking)
   - [Force Logout Capabilities](#4-force-logout-capabilities)
   - [Session Validation](#5-session-validation)
   - [User Session Management](#6-user-session-management)
   - [Admin Session Management](#7-admin-session-management)
5. [API Endpoint Reference](#api-endpoint-reference)
6. [Troubleshooting](#troubleshooting)
7. [Test Data Cleanup](#test-data-cleanup)

---

## Prerequisites

### Required Services

Ensure the following services are running:

```bash
# Start infrastructure (Redis, PostgreSQL, RabbitMQ)
pnpm infra:start

# Start backend services
pnpm dev:backend
```

### Verify Services

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# Check auth service health
curl -s http://localhost:3001/health | jq
# Expected: { "status": "healthy", ... }

# Check API Gateway health
curl -s http://localhost:3000/health | jq
# Expected: { "status": "healthy", ... }
```

### Test User Setup

Create test users for testing (or use existing ones):

```bash
# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!",
    "name": "Session Test User"
  }' | jq

# Register an admin user (if not exists)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-session@example.com",
    "password": "AdminPass123!",
    "name": "Admin Session Test"
  }' | jq
```

### Tools Required

- `curl` - HTTP client for API calls
- `jq` - JSON processor for formatting output
- `redis-cli` - Redis command-line interface
- Multiple browsers or incognito windows (for concurrent session testing)

---

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Auth Service                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Session Routes │  │ Session Service │  │  Auth Middleware│ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│           └──────────┬─────────┴─────────────────────┘          │
│                      │                                          │
│           ┌──────────▼──────────┐                               │
│           │   SessionManager    │  (from @payments-system/      │
│           │                     │   security library)           │
│           └──────────┬──────────┘                               │
│                      │                                          │
│  ┌───────────────────┼───────────────────┐                      │
│  │                   │                   │                      │
│  ▼                   ▼                   ▼                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐            │
│ │ Device      │ │ GeoIP       │ │ Activity        │            │
│ │ Fingerprint │ │ Service     │ │ Tracker         │            │
│ └─────────────┘ └─────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │  (Sessions) │
                    └─────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| **SessionManager** | Core session management service in security library |
| **DeviceFingerprintService** | Creates and validates device fingerprints |
| **Session Service** | Auth service integration layer |
| **Session Routes** | REST API endpoints for session management |

### Session Data Structure

```typescript
interface Session {
  id: string;                    // Unique session ID
  userId: string;                // User who owns the session
  refreshTokenHash: string;      // Hashed refresh token
  fingerprint: DeviceFingerprint; // Device fingerprint
  createdAt: Date;               // Session creation time
  lastActivityAt: Date;          // Last activity timestamp
  expiresAt: Date;               // Absolute expiration time
  isActive: boolean;             // Whether session is active
  metadata: {
    loginMethod: string;         // 'password', 'oauth', etc.
    location: LocationInfo;      // GeoIP location
  };
}

interface DeviceFingerprint {
  fingerprintHash: string;       // SHA-256 hash
  userAgent: string;             // Raw User-Agent
  browser: { name: string; version: string };
  os: { name: string; version: string };
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  ip: string;
  acceptLanguage: string | null;
  screenResolution: string | null;
  timezone: string | null;
  clientFingerprint: string | null;
}
```

---

## Test Environment Setup

### Environment Variables

The session manager can be configured via environment variables in auth service:

```bash
# Session configuration (apps/auth-service/.env)
SESSION_MAX_CONCURRENT=5           # Max concurrent sessions per user
SESSION_TIMEOUT_SECONDS=1800       # Idle timeout (30 minutes)
SESSION_LIFETIME_SECONDS=604800    # Absolute lifetime (7 days)
SESSION_FINGERPRINTING=true        # Enable device fingerprinting
SESSION_ACTIVITY_TRACKING=true     # Enable activity tracking
SESSION_VALIDATE_FINGERPRINT=true  # Validate fingerprint on requests
SESSION_FINGERPRINT_TOLERANCE=0.3  # Fingerprint mismatch tolerance (0-1)
SESSION_EVICTION_STRATEGY=oldest   # oldest, least_active, or none
SESSION_NOTIFY_NEW=true            # Notify on new session
SESSION_NOTIFY_LOGOUT=true         # Notify on force logout
```

### Reset Test Environment

```bash
# Clear all session data from Redis
redis-cli KEYS "session:*" | xargs -r redis-cli DEL
redis-cli KEYS "user_sessions:*" | xargs -r redis-cli DEL
redis-cli KEYS "force_logout:*" | xargs -r redis-cli DEL

# Verify cleanup
redis-cli KEYS "*session*"
# Expected: (empty array)
```

---

## Test Scenarios

### 1. Device Fingerprinting

Device fingerprinting identifies and tracks devices used for authentication.

#### 1.1 Basic Fingerprint Creation on Login

```bash
# Login with standard desktop browser User-Agent
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!"
  }' | jq

# Expected response includes session info:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJ...",
#     "user": { ... },
#     "sessionId": "sess_abc123..."
#   }
# }
```

#### 1.2 Different Browser Fingerprints

```bash
# Login with Firefox User-Agent (simulating different browser)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!"
  }' | jq

# This should create a new session with different fingerprint
```

#### 1.3 Mobile Device Fingerprint

```bash
# Login with mobile User-Agent
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!"
  }' | jq

# Expected: New session with deviceType: "mobile"
```

#### 1.4 View Session with Fingerprint Details

```bash
# First, login and save the token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.accessToken')

# Get session list to see fingerprint info
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: List of sessions with device info
# {
#   "success": true,
#   "data": {
#     "sessions": [
#       {
#         "id": "sess_...",
#         "device": "Chrome 120 on macOS 10.15.7 (Desktop)",
#         "ip": "127.0.0.1",
#         "location": "Unknown",
#         "lastActivity": "2026-01-20T...",
#         "createdAt": "2026-01-20T...",
#         "isCurrent": true
#       }
#     ],
#     "currentSessionId": "sess_..."
#   }
# }
```

#### 1.5 Extended Fingerprint with Client Data

```bash
# Login with extended client fingerprint data
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -H "X-Client-Fingerprint: fp_a1b2c3d4e5f6" \
  -H "X-Screen-Resolution: 1920x1080" \
  -H "X-Timezone: America/New_York" \
  -d '{
    "email": "session-test@example.com",
    "password": "SecurePass123!"
  }' | jq

# Extended fingerprint data will be stored with the session
```

---

### 2. Concurrent Session Limits

Test the system's ability to limit and manage concurrent sessions per user.

#### 2.1 Create Multiple Sessions (Within Limit)

```bash
# Create 5 sessions (default limit) with different User-Agents

# Session 1 - Chrome Windows
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq '.data.sessionId'

# Session 2 - Firefox Windows
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq '.data.sessionId'

# Session 3 - Safari macOS
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq '.data.sessionId'

# Session 4 - Chrome macOS
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq '.data.sessionId'

# Session 5 - Mobile Safari
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari/604.1" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq '.data.sessionId'

# All 5 should succeed
```

#### 2.2 Exceed Session Limit (Eviction)

```bash
# Login and get token from last session
LAST_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

# Create 6th session - should evict oldest
RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}')

echo "$RESULT" | jq

# Check if eviction occurred
echo "$RESULT" | jq '.data.evictedSession'
# Expected: { "sessionId": "sess_...", "device": "...", "reason": "max_concurrent_sessions" }

# View current sessions (should still be 5)
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $LAST_TOKEN" | jq '.data.sessions | length'
# Expected: 5
```

#### 2.3 Verify Evicted Session is Invalid

```bash
# Try to use a token from an evicted session
# (You would need to save the token from Session 1 before it was evicted)

# If you have the old token:
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $OLD_TOKEN" | jq

# Expected: 401 Unauthorized or session not found
```

#### 2.4 Check Session Limit in Redis

```bash
# Get user sessions count from Redis
# First, find the user ID
USER_ID=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.user.id')

# Check session count in Redis
redis-cli SCARD "user_sessions:$USER_ID"
# Expected: 5 (or your configured max)

# List all session IDs for user
redis-cli SMEMBERS "user_sessions:$USER_ID"
```

---

### 3. Session Activity Tracking

Test session activity monitoring and idle timeout behavior.

#### 3.1 View Session Activity

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

# Get session ID
SESSION_ID=$(curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.currentSessionId')

# View session activity (includes login event)
curl -s "http://localhost:3000/api/sessions/$SESSION_ID/activity" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected:
# {
#   "success": true,
#   "data": {
#     "activities": [
#       {
#         "timestamp": "2026-01-20T...",
#         "action": "session_created",
#         "ip": "127.0.0.1",
#         "userAgent": "..."
#       }
#     ]
#   }
# }
```

#### 3.2 Track Activity on API Calls

```bash
# Make some API calls to generate activity
for i in {1..5}; do
  curl -s http://localhost:3000/api/sessions \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  sleep 1
done

# Check updated activity
curl -s "http://localhost:3000/api/sessions/$SESSION_ID/activity" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.activities | length'

# Expected: Activity count increased (depending on tracking interval)
```

#### 3.3 Session Last Activity Update

```bash
# Get current session details
curl -s "http://localhost:3000/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.lastActivityAt'

# Wait and make another request
sleep 5

curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Check last activity timestamp updated
curl -s "http://localhost:3000/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.lastActivityAt'

# Expected: Timestamp should be more recent
```

#### 3.4 Check Activity in Redis

```bash
# View raw activity data in Redis
redis-cli LRANGE "session_activity:$SESSION_ID" 0 -1 | head -5

# Check session TTL (time until idle timeout)
redis-cli TTL "session:$SESSION_ID"
# Expected: Positive number (seconds until expiry)
```

---

### 4. Force Logout Capabilities

Test administrative force logout functionality.

#### 4.1 User Self-Logout (Single Session)

```bash
# Login and get token + session ID
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}')
TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
SESSION_ID=$(echo $LOGIN | jq -r '.data.sessionId')

# Logout this session
curl -s -X DELETE "http://localhost:3000/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: { "success": true, "message": "Session logged out successfully" }

# Verify session is invalid
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: 401 Unauthorized
```

#### 4.2 Logout Other Sessions (Keep Current)

```bash
# Create multiple sessions
for i in {1..3}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "User-Agent: Browser-$i/1.0" \
    -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' > /dev/null
done

# Login with main session
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: MainBrowser/1.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

# Check session count before
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq '.data.sessions | length'

# Logout all OTHER sessions
curl -s -X POST http://localhost:3000/api/sessions/logout-others \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: { "success": true, "data": { "loggedOutCount": 3 } }

# Verify only current session remains
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq '.data.sessions | length'
# Expected: 1
```

#### 4.3 Logout All Sessions (Including Current)

```bash
# Create a session
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

# Logout ALL sessions
curl -s -X POST http://localhost:3000/api/sessions/logout-all \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: { "success": true, "data": { "loggedOutCount": X } }

# Current token should now be invalid
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: 401 Unauthorized
```

#### 4.4 Admin Force Logout (Specific User)

```bash
# Login as admin (requires ADMIN role)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPass123!"}' | jq -r '.data.accessToken')

# Get user ID of target user
USER_ID="<user-id-from-previous-tests>"

# Create some sessions for target user first
for i in {1..3}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' > /dev/null
done

# Admin: View target user's sessions
curl -s "http://localhost:3000/api/admin/sessions/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Expected: List of all sessions for that user

# Admin: Force logout all of user's sessions
curl -s -X POST http://localhost:3000/api/admin/sessions/force-logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"reason\": \"Security concern - admin initiated\"
  }" | jq

# Expected:
# {
#   "success": true,
#   "data": {
#     "terminatedCount": 3,
#     "terminatedSessions": ["sess_...", "sess_...", "sess_..."],
#     "notified": true
#   }
# }
```

#### 4.5 Admin Force Logout Specific Sessions

```bash
# Get specific session IDs for user
SESSIONS=$(curl -s "http://localhost:3000/api/admin/sessions/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.sessions[0:2] | .[].id')

# Force logout only those sessions
curl -s -X POST http://localhost:3000/api/admin/sessions/force-logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"sessionIds\": [\"sess_abc\", \"sess_def\"],
    \"reason\": \"Suspicious activity detected\"
  }" | jq
```

#### 4.6 Admin Terminate Single Session

```bash
# Get a session ID
SESSION_ID=$(curl -s "http://localhost:3000/api/admin/sessions/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.sessions[0].id')

# Terminate that specific session
curl -s -X DELETE "http://localhost:3000/api/admin/sessions/$USER_ID/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "Device reported stolen"}' | jq

# Expected: { "success": true, "message": "Session terminated successfully" }
```

---

### 5. Session Validation

Test session validation including fingerprint checking.

#### 5.1 Valid Session Request

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 Chrome/120.0.0.0" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

# Make authenticated request with same User-Agent
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "User-Agent: Mozilla/5.0 Chrome/120.0.0.0" | jq

# Expected: Success - fingerprints match
```

#### 5.2 Changed Fingerprint (Different Browser)

```bash
# Use token but with different User-Agent
curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "User-Agent: Mozilla/5.0 Firefox/120.0" | jq

# Behavior depends on SESSION_FINGERPRINT_TOLERANCE:
# - High tolerance (0.5+): Request succeeds
# - Low tolerance (0.1): Request may be flagged or rejected
```

#### 5.3 Check Force Logout Flag

```bash
# After admin force logout, user's subsequent requests should fail
# even with valid JWT until force logout flag expires

# This is automatic - if user was force logged out,
# validateSession returns SESSION_FORCE_LOGOUT status
```

---

### 6. User Session Management

Test user-facing session management endpoints.

#### 6.1 List All My Sessions

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "session-test@example.com", "password": "SecurePass123!"}' | jq -r '.data.accessToken')

curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq

# Response includes:
# - List of all active sessions
# - Device description for each
# - Which session is current
# - Last activity timestamps
# - Location info (if available)
```

#### 6.2 Get Specific Session Details

```bash
SESSION_ID=$(curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.sessions[0].id')

curl -s "http://localhost:3000/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Detailed session info including full fingerprint data
```

#### 6.3 Remote Session Logout (From Another Device)

```bash
# Scenario: User logs in on phone, wants to log out laptop session

# Get all sessions
SESSIONS=$(curl -s http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN")

# Find the laptop session (not current)
LAPTOP_SESSION=$(echo $SESSIONS | jq -r '.data.sessions[] | select(.isCurrent == false) | .id' | head -1)

# Log out that session remotely
curl -s -X DELETE "http://localhost:3000/api/sessions/$LAPTOP_SESSION" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: Session terminated, current session still valid
```

---

### 7. Admin Session Management

Test administrative session management features.

#### 7.1 View Any User's Sessions

```bash
# As admin, view sessions for any user
curl -s "http://localhost:3000/api/admin/sessions/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Admin sees all session details including:
# - All active sessions
# - Device information
# - IP addresses
# - Last activity
# - Creation timestamps
```

#### 7.2 Bulk Force Logout (Security Incident)

```bash
# Force logout multiple users in response to security incident
for USER_ID in "user1-id" "user2-id" "user3-id"; do
  curl -s -X POST http://localhost:3000/api/admin/sessions/force-logout \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"reason\": \"Security incident: credential leak - mandatory re-authentication\"
    }" | jq '.data.terminatedCount'
done
```

#### 7.3 Exclude Current Session from Force Logout

```bash
# Force logout user but keep one session active
# (e.g., user reports suspicious activity from their current device)

TARGET_SESSION_TO_KEEP="sess_known-good-session"

curl -s -X POST http://localhost:3000/api/admin/sessions/force-logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"excludeSessionId\": \"$TARGET_SESSION_TO_KEEP\",
    \"reason\": \"Suspicious activity - keeping trusted device\"
  }" | jq
```

---

## API Endpoint Reference

### User Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions for current user |
| GET | `/api/sessions/:sessionId` | Get specific session details |
| GET | `/api/sessions/:sessionId/activity` | Get session activity history |
| DELETE | `/api/sessions/:sessionId` | Logout a specific session |
| POST | `/api/sessions/logout-others` | Logout all sessions except current |
| POST | `/api/sessions/logout-all` | Logout all sessions including current |

### Admin Endpoints (Require ADMIN Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/sessions/:userId` | View all sessions for a user |
| POST | `/api/admin/sessions/force-logout` | Force logout user sessions |
| DELETE | `/api/admin/sessions/:userId/:sessionId` | Terminate specific session |

### Request/Response Examples

#### GET /api/sessions

Response:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "sess_abc123",
        "device": "Chrome 120 on Windows 10 (Desktop)",
        "ip": "192.168.1.100",
        "location": "San Francisco, CA, US",
        "lastActivity": "2026-01-20T15:30:00.000Z",
        "createdAt": "2026-01-20T10:00:00.000Z",
        "isCurrent": true
      },
      {
        "id": "sess_def456",
        "device": "Safari 17 on iOS 17 (Mobile)",
        "ip": "192.168.1.101",
        "location": "San Francisco, CA, US",
        "lastActivity": "2026-01-20T14:00:00.000Z",
        "createdAt": "2026-01-19T20:00:00.000Z",
        "isCurrent": false
      }
    ],
    "currentSessionId": "sess_abc123"
  }
}
```

#### POST /api/admin/sessions/force-logout

Request:
```json
{
  "userId": "user_123",
  "sessionIds": ["sess_abc", "sess_def"],
  "excludeSessionId": "sess_ghi",
  "reason": "Security concern",
  "notify": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "terminatedCount": 2,
    "terminatedSessions": ["sess_abc", "sess_def"],
    "notified": true
  }
}
```

---

## Troubleshooting

### Issue: Session Not Created on Login

**Symptoms:**
- Login succeeds but no sessionId in response
- Sessions endpoint returns empty list

**Diagnosis:**
```bash
# Check if session manager initialized
docker logs auth-service 2>&1 | grep -i session

# Check Redis connectivity
redis-cli ping

# Check for errors in auth service logs
docker logs auth-service 2>&1 | tail -50
```

**Resolution:**
- Ensure Redis is running and accessible
- Check `REDIS_URL` environment variable
- Restart auth service after Redis is available

### Issue: Session Immediately Invalid

**Symptoms:**
- Login succeeds, but first authenticated request fails
- 401 errors on all requests

**Diagnosis:**
```bash
# Check session in Redis
redis-cli GET "session:$SESSION_ID"

# Check session TTL
redis-cli TTL "session:$SESSION_ID"

# Check if user was force logged out
redis-cli GET "force_logout:$USER_ID"
```

**Resolution:**
- Check `SESSION_TIMEOUT_SECONDS` isn't too low
- Ensure clocks are synchronized (NTP)
- Clear force logout flag if set incorrectly

### Issue: Sessions Not Being Evicted

**Symptoms:**
- More than max sessions exist
- New logins don't trigger eviction

**Diagnosis:**
```bash
# Check current session count
redis-cli SCARD "user_sessions:$USER_ID"

# Check eviction strategy
echo $SESSION_EVICTION_STRATEGY

# Check session manager logs
docker logs auth-service 2>&1 | grep -i evict
```

**Resolution:**
- Verify `SESSION_EVICTION_STRATEGY` is not "none"
- Check `SESSION_MAX_CONCURRENT` value
- Ensure Redis operations are not failing silently

### Issue: Fingerprint Mismatch Errors

**Symptoms:**
- Valid sessions being rejected
- "Fingerprint mismatch" in logs

**Diagnosis:**
```bash
# Check fingerprint tolerance
echo $SESSION_FINGERPRINT_TOLERANCE

# Compare request fingerprint components
# Check if User-Agent changed significantly
```

**Resolution:**
- Increase `SESSION_FINGERPRINT_TOLERANCE` (default 0.3)
- Disable strict fingerprint validation for debugging:
  `SESSION_VALIDATE_FINGERPRINT=false`
- Check for proxy/CDN that modifies headers

### Issue: Admin Cannot Force Logout

**Symptoms:**
- 403 Forbidden on admin endpoints
- "FORBIDDEN" error code

**Diagnosis:**
```bash
# Check user role in JWT
echo $ADMIN_TOKEN | cut -d'.' -f2 | base64 -d | jq '.role'

# Verify user has ADMIN role in database
```

**Resolution:**
- Ensure user has ADMIN role assigned
- Re-login to get fresh token with correct role
- Check role-based middleware configuration

### Issue: Activity Not Being Tracked

**Symptoms:**
- Empty activity arrays
- Last activity not updating

**Diagnosis:**
```bash
# Check activity tracking enabled
echo $SESSION_ACTIVITY_TRACKING

# Check activity in Redis
redis-cli LRANGE "session_activity:$SESSION_ID" 0 -1
```

**Resolution:**
- Enable `SESSION_ACTIVITY_TRACKING=true`
- Check Redis memory limits (activities stored in lists)
- Verify activity tracking interval isn't too long

---

## Test Data Cleanup

### Clear All Session Data

```bash
# Clear all session-related keys from Redis
redis-cli KEYS "session:*" | xargs -r redis-cli DEL
redis-cli KEYS "user_sessions:*" | xargs -r redis-cli DEL
redis-cli KEYS "session_activity:*" | xargs -r redis-cli DEL
redis-cli KEYS "force_logout:*" | xargs -r redis-cli DEL

# Verify cleanup
redis-cli KEYS "*session*"
redis-cli KEYS "*force_logout*"
```

### Clear Sessions for Specific User

```bash
# Get user ID
USER_ID="<user-id>"

# Get all session IDs for user
SESSION_IDS=$(redis-cli SMEMBERS "user_sessions:$USER_ID")

# Delete each session
for SID in $SESSION_IDS; do
  redis-cli DEL "session:$SID"
  redis-cli DEL "session_activity:$SID"
done

# Delete user session set
redis-cli DEL "user_sessions:$USER_ID"

# Delete force logout flag
redis-cli DEL "force_logout:$USER_ID"
```

### Reset Test Users

```bash
# Delete test users (requires database access)
# This should be done via Prisma Studio or direct SQL

# Via Prisma Studio
pnpm db:auth:studio
# Then manually delete test users

# Or via SQL
psql -U postgres -d auth_db -c "DELETE FROM users WHERE email LIKE '%session-test%';"
```

### Full Environment Reset

```bash
# Stop all services
pnpm infra:stop

# Clear Redis data
docker volume rm payments-system_redis-data 2>/dev/null || true

# Restart infrastructure
pnpm infra:start

# Wait for services
sleep 10

# Restart backend
pnpm dev:backend
```

---

## Automated Test Script

Save this as `test-sessions.sh` for quick validation:

```bash
#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api"
EMAIL="session-test-$(date +%s)@example.com"
PASSWORD="SecurePass123!"

echo "=== Session Management Test Suite ==="
echo "Test user: $EMAIL"
echo ""

# Register test user
echo "1. Registering test user..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"Session Test\"}" > /dev/null
echo "✓ User registered"

# Login and get token
echo "2. Logging in..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestBrowser/1.0" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
SESSION_ID=$(echo $LOGIN | jq -r '.data.sessionId // empty')
echo "✓ Logged in (Session: ${SESSION_ID:-'not returned'})"

# Get sessions
echo "3. Getting session list..."
SESSIONS=$(curl -s "$BASE_URL/sessions" -H "Authorization: Bearer $TOKEN")
SESSION_COUNT=$(echo $SESSIONS | jq '.data.sessions | length')
echo "✓ Found $SESSION_COUNT session(s)"

# Create additional sessions
echo "4. Creating additional sessions..."
for i in 2 3; do
  curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -H "User-Agent: TestBrowser-$i/1.0" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" > /dev/null
done
echo "✓ Created 2 additional sessions"

# Verify session count
echo "5. Verifying session count..."
SESSIONS=$(curl -s "$BASE_URL/sessions" -H "Authorization: Bearer $TOKEN")
SESSION_COUNT=$(echo $SESSIONS | jq '.data.sessions | length')
echo "✓ Total sessions: $SESSION_COUNT"

# Logout others
echo "6. Logging out other sessions..."
LOGOUT_RESULT=$(curl -s -X POST "$BASE_URL/sessions/logout-others" \
  -H "Authorization: Bearer $TOKEN")
LOGGED_OUT=$(echo $LOGOUT_RESULT | jq '.data.loggedOutCount // 0')
echo "✓ Logged out $LOGGED_OUT other session(s)"

# Verify only one session
echo "7. Verifying single session..."
SESSIONS=$(curl -s "$BASE_URL/sessions" -H "Authorization: Bearer $TOKEN")
SESSION_COUNT=$(echo $SESSIONS | jq '.data.sessions | length')
if [ "$SESSION_COUNT" -eq 1 ]; then
  echo "✓ Only 1 session remaining (current)"
else
  echo "✗ Expected 1 session, found $SESSION_COUNT"
  exit 1
fi

# Logout all
echo "8. Logging out all sessions..."
curl -s -X POST "$BASE_URL/sessions/logout-all" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✓ All sessions logged out"

# Verify token invalid
echo "9. Verifying token invalidated..."
RESULT=$(curl -s "$BASE_URL/sessions" -H "Authorization: Bearer $TOKEN")
if echo "$RESULT" | jq -e '.error' > /dev/null 2>&1; then
  echo "✓ Token correctly invalidated"
else
  echo "✗ Token should be invalid"
  exit 1
fi

echo ""
echo "=== All Tests Passed ==="
```

Make executable and run:
```bash
chmod +x test-sessions.sh
./test-sessions.sh
```

---

## Next Steps

After completing manual testing:

1. **Review Results**: Ensure all test scenarios pass
2. **Document Issues**: Note any unexpected behavior
3. **Performance Testing**: Test with higher concurrent session counts
4. **Integration Testing**: Test with frontend MFE session management UI
5. **Production Readiness**: Review configuration for production (timeouts, limits, etc.)

---

*Last updated: 2026-01-20*
*Session Management Implementation - Priority 7.3*
