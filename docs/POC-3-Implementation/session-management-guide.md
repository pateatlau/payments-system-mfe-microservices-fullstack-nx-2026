# Session Management Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for session management including cross-tab and cross-device synchronization

---

## Overview

POC-3 implements comprehensive session management with cross-tab synchronization, cross-device synchronization, and secure session storage using JWT tokens and WebSocket.

---

## Table of Contents

1. [Session Architecture](#session-architecture)
2. [JWT Token Management](#jwt-token-management)
3. [Cross-Tab Synchronization](#cross-tab-synchronization)
4. [Cross-Device Synchronization](#cross-device-synchronization)
5. [Session Security](#session-security)
6. [Implementation](#implementation)
7. [Troubleshooting](#troubleshooting)

---

## Session Architecture

### Components

- **JWT Tokens** - Access token (15 min) and refresh token (7 days)
- **WebSocket** - Real-time session synchronization
- **LocalStorage** - Token storage (encrypted)
- **Event Bus** - Cross-tab communication
- **Backend Session Store** - Redis for session tracking

### Session Flow

```
1. User logs in → JWT tokens generated
2. Tokens stored in localStorage (encrypted)
3. WebSocket connection established
4. Session events broadcast via WebSocket
5. Cross-tab sync via Event Bus
6. Cross-device sync via WebSocket
```

---

## JWT Token Management

### Token Structure

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}
```

### Token Storage

```typescript
// Store tokens securely
localStorage.setItem('accessToken', encryptedAccessToken);
localStorage.setItem('refreshToken', encryptedRefreshToken);
```

### Token Refresh

```typescript
// Automatic token refresh before expiration
useEffect(() => {
  const interval = setInterval(async () => {
    const token = getAccessToken();
    if (isTokenExpiringSoon(token)) {
      const newToken = await refreshToken();
      setAccessToken(newToken);
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, []);
```

---

## Cross-Tab Synchronization

### Event Bus Implementation

```typescript
// libs/shared-event-bus
class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit(event: string, data: unknown): void {
    // Broadcast to all tabs via BroadcastChannel
    const channel = new BroadcastChannel('session-sync');
    channel.postMessage({ event, data });

    // Also call local listeners
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}
```

### Session Events

```typescript
// Session events
interface SessionEvent {
  type: 'login' | 'logout' | 'token-refresh' | 'session-expired';
  payload: {
    userId?: string;
    token?: string;
    timestamp: string;
  };
}
```

### Usage

```typescript
// Listen for session events
eventBus.on('session:logout', () => {
  // Clear tokens
  clearTokens();
  // Redirect to login
  navigate('/signin');
});

// Emit session events
eventBus.emit('session:login', {
  userId: user.id,
  token: accessToken,
  timestamp: new Date().toISOString(),
});
```

---

## Cross-Device Synchronization

### WebSocket Integration

```typescript
// Session sync via WebSocket
const { sendMessage, lastMessage } = useWebSocket({
  url: 'wss://localhost/ws',
  token: accessToken,
});

useEffect(() => {
  if (lastMessage) {
    const message = JSON.parse(lastMessage.data);
    if (message.type === 'session:sync') {
      handleSessionSync(message.payload);
    }
  }
}, [lastMessage]);
```

### Session Sync Messages

```typescript
interface SessionSyncMessage {
  type: 'session:sync';
  payload: {
    action: 'login' | 'logout' | 'token-refresh';
    userId: string;
    sessionId: string;
    deviceId?: string;
    timestamp: string;
  };
}
```

### Device Registration

```typescript
// Register device on login
async function registerDevice(userId: string, deviceInfo: DeviceInfo) {
  await api.post('/api/auth/devices', {
    userId,
    deviceId: deviceInfo.id,
    deviceName: deviceInfo.name,
    lastActive: new Date().toISOString(),
  });
}
```

---

## Session Security

### Secure Token Storage

```typescript
// Encrypt tokens before storing
function encryptToken(token: string): string {
  // Use Web Crypto API or library
  return encrypt(token, encryptionKey);
}

function decryptToken(encryptedToken: string): string {
  return decrypt(encryptedToken, encryptionKey);
}
```

### Token Validation

```typescript
// Validate token on each request
async function validateToken(token: string): Promise<boolean> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
}
```

### Session Invalidation

```typescript
// Invalidate session on logout
async function invalidateSession(userId: string, sessionId: string) {
  // Remove from Redis
  await redis.del(`session:${sessionId}`);

  // Broadcast logout event
  await broadcastSessionEvent({
    type: 'session:logout',
    userId,
    sessionId,
  });
}
```

---

## Implementation

### Auth Store Integration

```typescript
// libs/shared-auth-store
interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
}
```

### WebSocket Provider

```typescript
// Wrap app with WebSocketProvider
<WebSocketProvider
  url="wss://localhost/ws"
  token={accessToken}
  autoConnect={true}
>
  <App />
</WebSocketProvider>
```

### Event Bus Provider

```typescript
// Wrap app with EventBusProvider
<EventBusProvider>
  <App />
</EventBusProvider>
```

---

## Troubleshooting

### Tokens Not Syncing Across Tabs

**Possible Causes:**

- BroadcastChannel not supported
- Event Bus not initialized
- LocalStorage not accessible

**Solutions:**

1. Check browser support for BroadcastChannel
2. Verify Event Bus initialization
3. Check localStorage permissions

### WebSocket Session Sync Not Working

**Possible Causes:**

- WebSocket not connected
- Token expired
- Server not broadcasting events

**Solutions:**

1. Verify WebSocket connection status
2. Check token validity
3. Verify server session sync implementation

### Session Expired Unexpectedly

**Possible Causes:**

- Token TTL too short
- Refresh token expired
- Server session invalidated

**Solutions:**

1. Increase token TTL if appropriate
2. Implement automatic token refresh
3. Check server session invalidation logic

---

## Additional Resources

- **Auth Store:** `libs/shared-auth-store/`
- **Event Bus:** `libs/shared-event-bus/`
- **WebSocket:** `libs/shared-websocket/`
- **WebSocket Guide:** `docs/POC-3-Implementation/websocket-implementation-guide.md`

---

**Last Updated:** 2026-12-11  
**Status:** Complete
