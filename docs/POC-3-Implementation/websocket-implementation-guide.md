# WebSocket Implementation Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for implementing and using WebSocket in POC-3

---

## Overview

This guide covers the complete WebSocket implementation in POC-3, including server setup, client integration, authentication, message handling, and best practices.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Implementation](#server-implementation)
3. [Client Implementation](#client-implementation)
4. [Authentication](#authentication)
5. [Message Types](#message-types)
6. [Connection Management](#connection-management)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Server Placement

WebSocket server is implemented in the **API Gateway** (centralized approach):

- **Path:** `/ws`
- **Port:** 3000 (same as API Gateway)
- **Protocol:** WSS (WebSocket Secure via nginx)
- **Authentication:** JWT token in query parameter

### Client Library

Frontend uses `libs/shared-websocket` library with React hooks:

- Connection management
- Automatic reconnection
- Message handling
- React hooks for easy integration

---

## Server Implementation

### Installation

WebSocket server is already implemented in API Gateway. No additional installation needed.

### Server Setup

```typescript
// apps/api-gateway/src/websocket/server.ts
import { createWebSocketServer } from './server';
import { createServer } from 'http';

const httpServer = createServer(app);
const wss = createWebSocketServer(httpServer);

httpServer.listen(3000, () => {
  console.log('API Gateway with WebSocket listening on port 3000');
});
```

### Authentication Flow

1. Client connects with JWT token: `wss://localhost/ws?token=JWT_TOKEN`
2. Server extracts token from URL query parameter
3. Server verifies JWT token
4. If valid, connection is established
5. If invalid, connection is rejected with 401

### Connection Manager

Manages all active WebSocket connections:

```typescript
class ConnectionManager {
  private connections = new Map<string, AuthenticatedWebSocket>();

  add(userId: string, ws: AuthenticatedWebSocket): void {
    this.connections.set(userId, ws);
  }

  remove(userId: string): void {
    this.connections.delete(userId);
  }

  get(userId: string): AuthenticatedWebSocket | undefined {
    return this.connections.get(userId);
  }

  broadcast(message: WebSocketMessage): void {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
```

### Room Management

Organizes connections into rooms (user, role, broadcast):

```typescript
class RoomManager {
  private rooms = new Map<string, Set<AuthenticatedWebSocket>>();

  join(room: string, ws: AuthenticatedWebSocket): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws);
  }

  leave(room: string, ws: AuthenticatedWebSocket): void {
    this.rooms.get(room)?.delete(ws);
  }

  sendToRoom(room: string, message: WebSocketMessage): void {
    this.rooms.get(room)?.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
```

### Heartbeat Mechanism

Server sends ping every 30 seconds, expects pong within 10 seconds:

```typescript
class HeartbeatManager {
  start(wss: WebSocketServer): void {
    setInterval(() => {
      wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
}
```

---

## Client Implementation

### Installation

The WebSocket client library is already available:

```typescript
import { useWebSocket } from '@payments-system/shared-websocket';
```

### Basic Usage

```typescript
// In a React component
import { useWebSocket } from '@payments-system/shared-websocket';

function PaymentsPage() {
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    url: 'wss://localhost/ws',
    token: accessToken, // JWT token from auth store
  });

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      if (message.type === 'payment:updated') {
        // Handle payment update
        console.log('Payment updated:', message.payload);
      }
    }
  }, [lastMessage]);

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### WebSocket Provider

Wrap your app with WebSocketProvider:

```typescript
// apps/shell/src/main.tsx
import { WebSocketProvider } from '@payments-system/shared-websocket';

function App() {
  const { accessToken } = useAuthStore();

  return (
    <WebSocketProvider
      url="wss://localhost/ws"
      token={accessToken}
      autoConnect={true}
    >
      <Router />
    </WebSocketProvider>
  );
}
```

### Connection Management

The client library handles:

- **Automatic reconnection** - Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- **Connection state** - `connecting`, `connected`, `disconnected`
- **Error handling** - Connection errors, authentication errors
- **Token refresh** - Reconnects with new token when expired

---

## Authentication

### Token Format

JWT token must include:

```typescript
{
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
  exp: number; // Expiration timestamp
}
```

### Connection URL

```typescript
const wsUrl = `wss://localhost/ws?token=${accessToken}`;
```

### Token Refresh

When token expires:

1. Client receives authentication error
2. Client closes WebSocket connection
3. Client refreshes JWT token via HTTP API
4. Client reconnects with new token

```typescript
// Automatic token refresh in WebSocketProvider
useEffect(() => {
  if (tokenExpired) {
    refreshToken().then(newToken => {
      setToken(newToken);
      reconnect();
    });
  }
}, [tokenExpired]);
```

---

## Message Types

### Server to Client Messages

```typescript
interface ServerMessage {
  type:
    | 'payment:updated'
    | 'session:sync'
    | 'notification:new'
    | 'system:broadcast'
    | 'pong';
  payload: unknown;
  timestamp: string;
  correlationId?: string;
}
```

### Client to Server Messages

```typescript
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  payload?: {
    room?: string;
    userId?: string;
  };
  timestamp: string;
}
```

### Message Examples

**Payment Update:**

```json
{
  "type": "payment:updated",
  "payload": {
    "paymentId": "pay_123",
    "status": "completed",
    "amount": 100.0
  },
  "timestamp": "2026-12-11T10:00:00Z"
}
```

**Session Sync:**

```json
{
  "type": "session:sync",
  "payload": {
    "userId": "user_123",
    "sessionId": "session_456",
    "action": "logout"
  },
  "timestamp": "2026-12-11T10:00:00Z"
}
```

**Subscribe to Room:**

```json
{
  "type": "subscribe",
  "payload": {
    "room": "user:user_123"
  },
  "timestamp": "2026-12-11T10:00:00Z"
}
```

---

## Connection Management

### Connection States

- **connecting** - Initial connection attempt
- **connected** - Successfully connected
- **disconnected** - Connection closed
- **reconnecting** - Attempting to reconnect

### Reconnection Strategy

Exponential backoff with max delay:

| Attempt | Delay     |
| ------- | --------- |
| 1       | 1s        |
| 2       | 2s        |
| 3       | 4s        |
| 4       | 8s        |
| 5       | 16s       |
| 6-10    | 30s (max) |

### Manual Reconnection

```typescript
const { reconnect } = useWebSocket({ ... });

// Manually trigger reconnection
reconnect();
```

---

## Error Handling

### Connection Errors

```typescript
const { error, isConnected } = useWebSocket({ ... });

useEffect(() => {
  if (error) {
    if (error.message.includes('401')) {
      // Authentication error - refresh token
      refreshToken();
    } else if (error.message.includes('ECONNREFUSED')) {
      // Server not available - show offline message
      showOfflineMessage();
    }
  }
}, [error]);
```

### Message Errors

```typescript
const { lastMessage } = useWebSocket({ ... });

useEffect(() => {
  if (lastMessage) {
    try {
      const message = JSON.parse(lastMessage.data);
      // Handle message
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }
}, [lastMessage]);
```

---

## Testing

### Unit Tests

```bash
# Test WebSocket client library
pnpm test:shared-websocket
```

### Integration Tests

```bash
# Test WebSocket server
pnpm test:api-gateway
```

### Manual Testing

```bash
# Test WebSocket connection with wscat
wscat -c wss://localhost/ws?token=YOUR_JWT_TOKEN

# Send message
> {"type":"ping","timestamp":"2026-12-11T10:00:00Z"}

# Receive message
< {"type":"pong","timestamp":"2026-12-11T10:00:01Z"}
```

### Security Tests

```bash
# Test WebSocket authentication
pnpm test:security:validation
```

---

## Troubleshooting

### Connection Fails Immediately

**Possible Causes:**

- Invalid JWT token
- Token expired
- nginx not configured for WebSocket
- API Gateway not running

**Solutions:**

1. Verify JWT token is valid and not expired
2. Check nginx WebSocket configuration (`/ws` location)
3. Verify API Gateway is running: `curl http://localhost:3000/api/health`
4. Check nginx logs: `docker-compose logs nginx`

### Connection Drops Frequently

**Possible Causes:**

- Network instability
- Server timeout
- Heartbeat not working

**Solutions:**

1. Check network connectivity
2. Verify heartbeat mechanism is working
3. Increase WebSocket timeout in nginx:
   ```nginx
   proxy_read_timeout 86400s;
   proxy_send_timeout 86400s;
   ```

### Messages Not Received

**Possible Causes:**

- Not subscribed to correct room
- Message type mismatch
- Connection not established

**Solutions:**

1. Verify subscription message was sent
2. Check message type matches expected format
3. Verify connection state is `connected`

### Authentication Errors

**Possible Causes:**

- Token expired
- Invalid token format
- Token not in query parameter

**Solutions:**

1. Refresh JWT token
2. Verify token format includes required fields (userId, email, role)
3. Check connection URL includes token: `wss://localhost/ws?token=...`

---

## Best Practices

### 1. Always Handle Connection State

```typescript
const { isConnected } = useWebSocket({ ... });

if (!isConnected) {
  return <div>Connecting...</div>;
}
```

### 2. Validate Messages

```typescript
const { lastMessage } = useWebSocket({ ... });

useEffect(() => {
  if (lastMessage) {
    try {
      const message = JSON.parse(lastMessage.data);
      if (message.type && message.timestamp) {
        // Handle valid message
      }
    } catch (error) {
      // Handle invalid message
    }
  }
}, [lastMessage]);
```

### 3. Clean Up Subscriptions

```typescript
useEffect(() => {
  // Subscribe on mount
  sendMessage({
    type: 'subscribe',
    payload: { room: 'user:user_123' },
    timestamp: new Date().toISOString(),
  });

  return () => {
    // Unsubscribe on unmount
    sendMessage({
      type: 'unsubscribe',
      payload: { room: 'user:user_123' },
      timestamp: new Date().toISOString(),
    });
  };
}, []);
```

### 4. Handle Token Refresh

```typescript
const { accessToken } = useAuthStore();
const { reconnect } = useWebSocket({
  url: 'wss://localhost/ws',
  token: accessToken,
});

useEffect(() => {
  // Reconnect when token changes
  if (accessToken) {
    reconnect();
  }
}, [accessToken]);
```

---

## Additional Resources

- **Architecture Document:** `docs/POC-3-Implementation/websocket-architecture.md`
- **Server Implementation:** `apps/api-gateway/src/websocket/`
- **Client Library:** `libs/shared-websocket/`
- **Security Tests:** `scripts/security/security-validation.test.ts`

---

**Last Updated:** 2026-12-11  
**Status:** Complete
