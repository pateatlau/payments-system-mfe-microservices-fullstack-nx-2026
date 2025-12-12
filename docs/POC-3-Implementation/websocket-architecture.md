# WebSocket Architecture - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Define WebSocket architecture for real-time communication

---

## Executive Summary

This document defines the WebSocket architecture for POC-3, enabling real-time communication between the backend and frontend applications. WebSocket support enables payment status updates, session synchronization, and admin notifications without polling.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend                                        │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Shell App   │  │  Auth MFE    │  │ Payments MFE │  │  Admin MFE   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │                  │           │
│         └──────────────────┴──────────────────┴──────────────────┘           │
│                                    │                                         │
│                    ┌───────────────▼───────────────┐                        │
│                    │   shared-websocket Library    │                        │
│                    │   - Connection management     │                        │
│                    │   - Reconnection logic        │                        │
│                    │   - React hooks              │                        │
│                    └───────────────┬───────────────┘                        │
│                                    │                                         │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     │ WSS (WebSocket Secure)
                                     │ wss://localhost/ws
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                              nginx                                           │
│                   (WebSocket Proxy - Upgrade Headers)                        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                          API Gateway (Port 3000)                             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Server (ws library)                      │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │
│  │  │ Connection  │  │   Room      │  │  Message    │                  │  │
│  │  │ Manager     │  │   Manager   │  │  Handler    │                  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐                                   │  │
│  │  │ JWT Auth    │  │  Heartbeat  │                                   │  │
│  │  │ Middleware  │  │  Manager    │                                   │  │
│  │  └─────────────┘  └─────────────┘                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                    ┌───────────────▼───────────────┐                        │
│                    │     RabbitMQ Subscriber       │                        │
│                    │   (Receives service events)   │                        │
│                    └───────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Placement Decision

### Decision: API Gateway (Centralized)

**Rationale:**

1. **Single Entry Point** - All WebSocket connections go through one server
2. **Unified Authentication** - JWT validation in one place
3. **Event Aggregation** - Subscribe to all service events from RabbitMQ
4. **Simpler nginx Config** - Single upstream for WebSocket
5. **Easier Scaling** - Scale API Gateway instances for WebSocket load

**Alternative Considered:** Dedicated WebSocket Service

- Pros: Complete separation of concerns
- Cons: Additional service to maintain, deploy, and monitor
- Decision: Not needed for POC-3 scope

### Configuration

```
Path: /ws
Port: 3000 (same as API Gateway)
Protocol: WSS (WebSocket Secure via nginx)
```

---

## 3. Authentication Flow

### 3.1 Connection Authentication

```
Client                           nginx                      API Gateway
  │                                │                             │
  │ wss://localhost/ws?token=JWT   │                             │
  │ ──────────────────────────────►│                             │
  │                                │                             │
  │                                │ Proxy to :3000/ws          │
  │                                │ ────────────────────────────►
  │                                │                             │
  │                                │           Validate JWT      │
  │                                │           ◄──────────────── │
  │                                │                             │
  │                                │    Accept/Reject Connection │
  │                                │ ◄────────────────────────── │
  │                                │                             │
  │ Connection Established         │                             │
  │ ◄──────────────────────────────│                             │
```

### 3.2 Token Validation

```typescript
// API Gateway WebSocket authentication
import { WebSocket, WebSocketServer } from 'ws';
import { verifyToken } from '../utils/jwt';

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  userRole: string;
  isAlive: boolean;
}

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  try {
    // Extract token from query params
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Verify JWT
    const payload = await verifyToken(token);

    // Complete WebSocket upgrade
    wss.handleUpgrade(request, socket, head, ws => {
      const authWs = ws as AuthenticatedWebSocket;
      authWs.userId = payload.userId;
      authWs.userRole = payload.role;
      authWs.isAlive = true;

      wss.emit('connection', authWs, request);
    });
  } catch (error) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});
```

### 3.3 Token Refresh Handling

When JWT expires, client must:

1. Close existing WebSocket connection
2. Refresh JWT via HTTP API
3. Reconnect with new token

```typescript
// Client-side token refresh
class WebSocketClient {
  private async reconnectWithNewToken(): Promise<void> {
    // Close existing connection
    this.ws?.close();

    // Refresh token
    const newToken = await this.authService.refreshToken();

    // Reconnect
    this.connect(newToken);
  }
}
```

---

## 4. Message Types and Formats

### 4.1 Base Message Structure

```typescript
interface WebSocketMessage {
  type: string; // Message type identifier
  payload: unknown; // Message data
  timestamp: string; // ISO 8601 timestamp
  correlationId?: string; // Optional request tracking
}

// Server to Client message
interface ServerMessage extends WebSocketMessage {
  type:
    | 'payment:updated'
    | 'session:sync'
    | 'notification:new'
    | 'system:broadcast'
    | 'pong';
}

// Client to Server message
interface ClientMessage extends WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
}
```

### 4.2 Message Types

| Type                 | Direction               | Description                    |
| -------------------- | ----------------------- | ------------------------------ |
| `payment:updated`    | Server → Client         | Payment status changed         |
| `payment:created`    | Server → Client         | New payment created            |
| `session:sync`       | Server → Client         | Session state update           |
| `session:logout`     | Server → Client         | Force logout from other device |
| `notification:new`   | Server → Client         | New notification               |
| `system:broadcast`   | Server → Client         | System-wide announcement       |
| `admin:user-updated` | Server → Client (ADMIN) | User data changed              |
| `admin:metrics`      | Server → Client (ADMIN) | Real-time metrics              |
| `subscribe`          | Client → Server         | Subscribe to channel           |
| `unsubscribe`        | Client → Server         | Unsubscribe from channel       |
| `ping`               | Client → Server         | Heartbeat ping                 |
| `pong`               | Server → Client         | Heartbeat response             |

### 4.3 Message Examples

**Payment Updated:**

```json
{
  "type": "payment:updated",
  "payload": {
    "paymentId": "pay-123",
    "status": "completed",
    "amount": 100.0,
    "currency": "USD"
  },
  "timestamp": "2026-12-10T10:30:00.000Z",
  "correlationId": "req-456"
}
```

**Session Sync:**

```json
{
  "type": "session:sync",
  "payload": {
    "action": "logout",
    "deviceId": "device-789",
    "reason": "logout_other_devices"
  },
  "timestamp": "2026-12-10T10:30:00.000Z"
}
```

**Subscribe to Channel:**

```json
{
  "type": "subscribe",
  "payload": {
    "channel": "payments"
  },
  "timestamp": "2026-12-10T10:30:00.000Z"
}
```

---

## 5. Room/Channel Strategy

### 5.1 Room Types

| Room Pattern    | Description          | Access              |
| --------------- | -------------------- | ------------------- |
| `user:{userId}` | User-specific events | Owner only          |
| `role:admin`    | Admin-only events    | ADMIN role          |
| `role:vendor`   | Vendor-only events   | VENDOR role         |
| `payments`      | Payment updates      | Authenticated users |
| `broadcast`     | System announcements | All users           |

### 5.2 Room Implementation

```typescript
class RoomManager {
  private rooms: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  join(ws: AuthenticatedWebSocket, room: string): void {
    // Validate room access
    if (!this.canJoin(ws, room)) {
      this.sendError(ws, 'Access denied to room');
      return;
    }

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws);
  }

  leave(ws: AuthenticatedWebSocket, room: string): void {
    this.rooms.get(room)?.delete(ws);
  }

  broadcast(room: string, message: ServerMessage): void {
    const clients = this.rooms.get(room);
    if (!clients) return;

    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private canJoin(ws: AuthenticatedWebSocket, room: string): boolean {
    // User-specific room
    if (room.startsWith('user:')) {
      return room === `user:${ws.userId}`;
    }

    // Role-based room
    if (room.startsWith('role:')) {
      const requiredRole = room.replace('role:', '').toUpperCase();
      return ws.userRole === requiredRole;
    }

    // Public rooms
    return true;
  }
}
```

### 5.3 Auto-Join on Connection

```typescript
wss.on('connection', (ws: AuthenticatedWebSocket) => {
  // Auto-join user's personal room
  roomManager.join(ws, `user:${ws.userId}`);

  // Auto-join role room
  roomManager.join(ws, `role:${ws.userRole.toLowerCase()}`);

  // Auto-join broadcast room
  roomManager.join(ws, 'broadcast');

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connection:established',
      payload: {
        userId: ws.userId,
        rooms: [
          `user:${ws.userId}`,
          `role:${ws.userRole.toLowerCase()}`,
          'broadcast',
        ],
      },
      timestamp: new Date().toISOString(),
    })
  );
});
```

---

## 6. Reconnection Strategy

### 6.1 Client-Side Reconnection

```typescript
interface ReconnectionConfig {
  initialDelay: number; // 1000ms
  maxDelay: number; // 30000ms
  backoffMultiplier: number; // 2
  maxAttempts: number; // 10
}

class WebSocketClient {
  private config: ReconnectionConfig = {
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    maxAttempts: 10,
  };

  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxAttempts) {
      this.emit('max_reconnect_attempts');
      return;
    }

    const delay = Math.min(
      this.config.initialDelay *
        Math.pow(this.config.backoffMultiplier, this.reconnectAttempts),
      this.config.maxDelay
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private onOpen(): void {
    this.reconnectAttempts = 0;
    this.emit('connected');
  }

  private onClose(event: CloseEvent): void {
    if (event.code !== 1000) {
      // Abnormal close, attempt reconnect
      this.scheduleReconnect();
    }
    this.emit('disconnected');
  }
}
```

### 6.2 Reconnection Delays

| Attempt | Delay            |
| ------- | ---------------- |
| 1       | 1 second         |
| 2       | 2 seconds        |
| 3       | 4 seconds        |
| 4       | 8 seconds        |
| 5       | 16 seconds       |
| 6-10    | 30 seconds (max) |

---

## 7. Heartbeat/Ping-Pong Mechanism

### 7.1 Server-Side Heartbeat

```typescript
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 10000; // 10 seconds

class HeartbeatManager {
  private interval: NodeJS.Timeout | null = null;

  start(wss: WebSocketServer): void {
    this.interval = setInterval(() => {
      wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          // No pong received, terminate connection
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, HEARTBEAT_INTERVAL);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Handle pong from client
wss.on('connection', (ws: AuthenticatedWebSocket) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });
});
```

### 7.2 Client-Side Heartbeat

```typescript
class WebSocketClient {
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString(),
          })
        );

        // Set timeout for pong response
        this.pongTimeout = setTimeout(() => {
          // No pong received, reconnect
          this.ws?.close();
          this.scheduleReconnect();
        }, 10000);
      }
    }, 30000);
  }

  private handleMessage(data: string): void {
    const message = JSON.parse(data);

    if (message.type === 'pong') {
      // Clear pong timeout
      if (this.pongTimeout) {
        clearTimeout(this.pongTimeout);
        this.pongTimeout = null;
      }
      return;
    }

    // Handle other messages
    this.emit('message', message);
  }
}
```

---

## 8. RabbitMQ Integration

### 8.1 Event Forwarding

```typescript
import { RabbitMQSubscriber } from '@mfe-poc/rabbitmq-event-hub';

class WebSocketEventBridge {
  private subscriber: RabbitMQSubscriber;
  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
    this.subscriber = new RabbitMQSubscriber('api-gateway');
  }

  async start(): Promise<void> {
    // Subscribe to payment events
    await this.subscriber.subscribe('payments.#', async event => {
      // Forward to user's room
      const userId = event.data.senderId || event.data.userId;
      if (userId) {
        this.roomManager.broadcast(`user:${userId}`, {
          type: `payment:${event.type.split('.').pop()}`,
          payload: event.data,
          timestamp: event.timestamp,
          correlationId: event.correlationId,
        });
      }

      // Forward to admin room
      this.roomManager.broadcast('role:admin', {
        type: `payment:${event.type.split('.').pop()}`,
        payload: event.data,
        timestamp: event.timestamp,
        correlationId: event.correlationId,
      });
    });

    // Subscribe to auth events (for session sync)
    await this.subscriber.subscribe('auth.#', async event => {
      const userId = event.data.userId;
      if (userId) {
        this.roomManager.broadcast(`user:${userId}`, {
          type: `session:${event.type.split('.').pop()}`,
          payload: event.data,
          timestamp: event.timestamp,
        });
      }
    });

    // Subscribe to admin events
    await this.subscriber.subscribe('admin.#', async event => {
      this.roomManager.broadcast('role:admin', {
        type: `admin:${event.type.split('.').pop()}`,
        payload: event.data,
        timestamp: event.timestamp,
      });
    });
  }
}
```

---

## 9. Frontend Library Design

### 9.1 React Hooks

```typescript
// libs/shared-websocket/src/hooks/useWebSocket.ts
export function useWebSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!token) return;

    const client = new WebSocketClient({
      url: `${WS_URL}?token=${token}`,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onMessage: msg => setLastMessage(msg),
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [token]);

  const sendMessage = useCallback((message: ClientMessage) => {
    clientRef.current?.send(message);
  }, []);

  return { isConnected, lastMessage, sendMessage };
}

// libs/shared-websocket/src/hooks/useWebSocketSubscription.ts
export function useWebSocketSubscription<T>(
  eventType: string,
  handler: (payload: T) => void
) {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === eventType) {
      handler(lastMessage.payload as T);
    }
  }, [lastMessage, eventType, handler]);
}

// libs/shared-websocket/src/hooks/useRealTimeUpdates.ts
export function useRealTimeUpdates(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type.startsWith('payment:')) {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey });
    }
  }, [lastMessage, queryClient, queryKey]);
}
```

### 9.2 WebSocket Provider

```typescript
// libs/shared-websocket/src/context/WebSocketProvider.tsx
export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const clientRef = useRef<WebSocketClient | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionError: null,
  });

  useEffect(() => {
    if (!token) {
      clientRef.current?.disconnect();
      return;
    }

    const client = new WebSocketClient({
      url: `${import.meta.env.VITE_WS_URL || 'wss://localhost'}/ws?token=${token}`,
    });

    client.on('connected', () => setState(s => ({ ...s, isConnected: true })));
    client.on('disconnected', () => setState(s => ({ ...s, isConnected: false })));
    client.on('error', error => setState(s => ({ ...s, connectionError: error })));

    client.connect();
    clientRef.current = client;

    return () => client.disconnect();
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ ...state, client: clientRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

---

## 10. Security Considerations

### 10.1 Authentication

- JWT required for connection
- Token validated on upgrade
- Token expiry triggers reconnect

### 10.2 Authorization

- Room access controlled by role
- User rooms restricted to owner
- Admin rooms restricted to ADMIN role

### 10.3 Rate Limiting

- Connection rate limit per IP
- Message rate limit per connection
- Implemented in nginx and application

### 10.4 Message Validation

- All messages validated against schema
- Invalid messages rejected
- Malformed messages logged

---

## 11. Verification Checklist

- [x] Server placement defined (API Gateway)
- [x] Auth flow defined (JWT in query param)
- [x] Message types defined (10+ types)
- [x] Room strategy defined (user, role, broadcast)
- [x] Reconnection defined (exponential backoff)
- [x] Heartbeat defined (30s ping, 10s timeout)
- [x] RabbitMQ integration designed
- [x] Frontend hooks designed

---

**Last Updated:** 2026-12-10  
**Status:** Complete  
**Next Steps:** Use this architecture in Phase 4 (WebSocket Implementation)
