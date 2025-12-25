# WebSocket Implementation Deep Dive - POC-3

**Date:** December 23, 2025  
**Purpose:** Understanding how WebSocket clients are initialized and used across the MFE system

---

## Architecture Overview

The WebSocket implementation follows a **Provider Pattern** with **React Hooks**, enabling real-time bidirectional communication between frontend MFEs and backend services through the API Gateway.

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (MFE)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Shell (Host MFE) - bootstrap.tsx                     │   │
│  │  ├─ Initializes Sentry, Auth, Theme                 │   │
│  │  └─ Creates AppWrapper component                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AppWrapper Component                                 │   │
│  │  ├─ Gets accessToken from useAuthStore               │   │
│  │  ├─ Gets user info from useAuthStore                 │   │
│  │  └─ Passes token to WebSocketProvider                │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocketProvider (Context)                          │   │
│  │  ├─ Creates WebSocketClient instance                 │   │
│  │  ├─ Manages connection lifecycle                      │   │
│  │  ├─ Provides client via context                       │   │
│  │  └─ Auto-connects when token available               │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Remote MFEs (Payments, Admin, Profile)               │   │
│  │  ├─ usePaymentUpdates()     (Payments MFE)           │   │
│  │  ├─ useDashboardUpdates()   (Admin MFE)              │   │
│  │  └─ useProfileUpdates()     (Profile MFE)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Hooks Integration                                    │   │
│  │  ├─ useWebSocket()                                   │   │
│  │  ├─ useWebSocketSubscription()                       │   │
│  │  ├─ useRealTimeUpdates()         [Query invalidate]  │   │
│  │  └─ useRealTimeQueryUpdate()     [Direct update]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    WebSocket (WSS/WS)
                     JWT Authentication
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Backend)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocket Server (apps/api-gateway/src/websocket/)  │   │
│  │                                                       │   │
│  │  ├─ server.ts          - Main WS server              │   │
│  │  ├─ auth.ts            - JWT authentication          │   │
│  │  ├─ connection-manager.ts - Track connections        │   │
│  │  ├─ room-manager.ts    - Pub/sub rooms               │   │
│  │  ├─ heartbeat.ts       - Ping/pong (30s/10s)         │   │
│  │  ├─ event-bridge.ts    - RabbitMQ → WebSocket        │   │
│  │  └─ types.ts           - TypeScript interfaces       │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Backend Services (Auth, Payments, Admin, Profile)    │   │
│  │  └─ Publish events to RabbitMQ                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Client Initialization Flow

### Step 1: Shell Bootstrap (Entry Point)

**File:** `apps/shell/src/bootstrap.tsx`

```typescript
// 1. Initialize Sentry
initSentry({
  appName: 'shell',
});

// 2. Create AppWrapper that provides auth context
function AppWrapper() {
  // 3. Get auth data from Zustand store
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);

  // 4. Get WebSocket URL from env or use default
  const wsUrl = process.env['NX_WS_URL'] || 'wss://localhost/ws';

  // 5. Set Sentry user context
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }
  }, [user]);

  // 6. Wrap entire app with WebSocketProvider
  return (
    <WebSocketProvider
      url={wsUrl}
      token={accessToken || undefined}
      debug={process.env['NODE_ENV'] === 'development'}
    >
      <App /> {/* Contains remote MFEs */}
    </WebSocketProvider>
  );
}

// 7. Render to DOM
root.render(
  <StrictMode>
    <SentryErrorBoundary>
      <AppWrapper />
    </SentryErrorBoundary>
  </StrictMode>
);
```

**Key Points:**

- ✅ Single WebSocketProvider at root level (host shell)
- ✅ Token passed from auth store
- ✅ Debug mode enabled in development
- ✅ All child MFEs share same WebSocket connection

---

### Step 2: WebSocketProvider Context

**File:** `libs/shared-websocket/src/context/WebSocketProvider.tsx`

```typescript
export interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;              // WebSocket server URL
  token?: string;           // JWT token for authentication
  autoConnect?: boolean;    // Auto-connect on mount (default: true)
  debug?: boolean;          // Enable debug logging (default: false)
}

export function WebSocketProvider({
  children,
  url,
  token,
  autoConnect = true,
  debug = false,
}: WebSocketProviderProps): JSX.Element {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // 1. Create WebSocketClient with configuration
  const client = useMemo(() => {
    return new WebSocketClient({
      url,
      token,
      debug,
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,          // Start with 1s
      maxReconnectDelay: 30000,      // Cap at 30s
      pingInterval: 30000,           // Send ping every 30s
    });
  }, [url, token, debug]);

  // 2. Setup lifecycle (connect/disconnect)
  useEffect(() => {
    // Listen for status changes
    const handleStatus = ({
      status: newStatus,
    }: {
      status: ConnectionStatus;
    }) => {
      setStatus(newStatus);
    };

    client.on('status', handleStatus);

    // Auto-connect if enabled and token available
    if (autoConnect && token) {
      client.connect();
    }

    // Cleanup on unmount
    return () => {
      client.off('status', handleStatus);
      client.disconnect();
    };
  }, [client, autoConnect, token]);

  // 3. Provide context to all children
  const value = useMemo(
    () => ({
      client,
      status,
      isConnected: status === 'connected',
    }),
    [client, status]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

**Key Configuration:**
| Setting | Value | Purpose |
|---------|-------|---------|
| `autoReconnect` | true | Auto-retry on disconnect |
| `maxReconnectAttempts` | 10 | Stop after 10 failed attempts |
| `reconnectDelay` | 1000ms | Initial retry delay |
| `maxReconnectDelay` | 30000ms | Cap retry delay at 30s |
| `pingInterval` | 30000ms | Heartbeat every 30s |
| `debug` | true (dev) | Console logs in development |

---

### Step 3: WebSocketClient Core

**File:** `libs/shared-websocket/src/lib/client.ts`

```typescript
export class WebSocketClient implements IWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private status: ConnectionStatus = 'disconnected';
  private reconnectionManager: ReconnectionManager;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private pingTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reconnectionManager = new ReconnectionManager({
      maxAttempts: this.config.maxReconnectAttempts,
      initialDelay: this.config.reconnectDelay,
      maxDelay: this.config.maxReconnectDelay,
    });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    // 1. Skip if already connecting/connected
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.log('Already connected or connecting');
      return;
    }

    this.setStatus('connecting');

    try {
      // 2. Build URL with JWT token in query parameter
      const url = `${this.config.url}?token=${encodeURIComponent(this.config.token || '')}`;

      // 3. Create WebSocket connection
      this.ws = new WebSocket(url);

      // 4. Setup event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      this.log('Connecting to WebSocket server', url);
    } catch (error) {
      this.log('Failed to connect', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open (successful connection)
   */
  private handleOpen(): void {
    this.log('Connected to WebSocket server');

    // 1. Reset reconnection attempts
    this.reconnectionManager.reset();

    // 2. Update status
    this.setStatus('connected');

    // 3. Flush queued messages
    this.flushMessageQueue();

    // 4. Re-subscribe to previous subscriptions
    this.resubscribe();

    // 5. Start heartbeat (ping)
    this.startPing();

    // 6. Emit connected event
    this.emit('connected', {
      message: 'WebSocket connected',
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      // 1. Handle pong response
      if (message.type === 'pong') {
        // Clear timeout, server is alive
        return;
      }

      // 2. Handle other messages
      this.emit(message.type, message.payload);
    } catch (error) {
      this.log('Failed to parse message', error);
    }
  }

  /**
   * Start heartbeat (ping every 30s)
   */
  private startPing(): void {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString(),
        });
        this.log('Ping sent');
      }
    }, this.config.pingInterval);
  }
}
```

---

## Initialization in Remote MFEs

### Payments MFE

**File:** `apps/payments-mfe/src/main.tsx`

```typescript
function AppWrapper() {
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);

  // Note: Uses direct API Gateway URL (not through nginx proxy)
  const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';

  return (
    <WebSocketProvider
      url={wsUrl}
      token={accessToken || undefined}
      debug={process.env['NODE_ENV'] === 'development'}
      autoConnect={true}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WebSocketProvider>
  );
}

// When loaded as remote: WebSocket already initialized by shell!
// Uses same connection, just accesses via useWebSocket() hook
```

### Admin MFE

**File:** `apps/admin-mfe/src/main.tsx`

```typescript
// Same pattern as Payments MFE
// When in shell: Uses shell's WebSocketProvider
// When standalone: Creates its own WebSocketProvider
```

---

## Hook Integration Points

### 1. Main WebSocket Hook

**File:** `libs/shared-websocket/src/hooks/useWebSocket.ts`

```typescript
export function useWebSocket(): UseWebSocketReturn {
  const { client, status, isConnected } = useWebSocketContext();

  if (!client) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  return {
    client, // WebSocketClient instance
    status, // 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
    isConnected, // boolean - shorthand for status === 'connected'
    connect, // Function to manually connect
    disconnect, // Function to manually disconnect
  };
}
```

**Usage Example:**

```typescript
function MyComponent() {
  const { status, isConnected } = useWebSocket();

  return (
    <div>
      Status: {status}
      {isConnected ? '✅ Connected' : '❌ Disconnected'}
    </div>
  );
}
```

---

### 2. Event Subscription Hook

**File:** `libs/shared-websocket/src/hooks/useWebSocketSubscription.ts`

```typescript
export function useWebSocketSubscription<T = unknown>(
  eventType: string,
  callback: EventListener<T>,
  deps?: React.DependencyList
): void {
  const { client, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // 1. Subscribe to event type on server
    client.subscribe(eventType);

    // 2. Register local event listener
    client.on(eventType, callback);

    // 3. Cleanup on unmount
    return () => {
      client.off(eventType, callback);
      // Note: Don't unsubscribe - other components might listen
    };
  }, [client, eventType, isConnected, ...deps]);
}
```

**Usage Example:**

```typescript
function PaymentComponent() {
  useWebSocketSubscription('payment:updated', payload => {
    console.log('Payment updated:', payload);
  });
}
```

---

### 3. Real-Time Query Invalidation

**File:** `libs/shared-websocket/src/hooks/useRealTimeUpdates.ts`

```typescript
export function useRealTimeUpdates(config: RealTimeUpdateConfig): void {
  const queryClient = useQueryClient();

  useWebSocketSubscription(config.eventType, (payload: unknown) => {
    // 1. Invalidate all specified query keys
    config.queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
    });

    // 2. Call optional custom handler
    if (config.onEvent) {
      config.onEvent(payload);
    }
  });
}
```

---

## Actual MFE Implementations

### Payments MFE Hook

**File:** `apps/payments-mfe/src/hooks/usePaymentUpdates.ts`

```typescript
export function usePaymentUpdates() {
  const queryClient = useQueryClient();

  const handlePaymentCreated = useCallback(
    (payload: PaymentUpdatePayload) => {
      console.log('[PaymentUpdates] Payment created:', payload);

      // Invalidate payments list to refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    [queryClient]
  );

  const handlePaymentUpdated = useCallback(
    (payload: PaymentUpdatePayload) => {
      console.log('[PaymentUpdates] Payment updated:', payload);

      // Invalidate both list and individual payment queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (payload.paymentId) {
        queryClient.invalidateQueries({
          queryKey: ['payment', payload.paymentId],
        });
      }
    },
    [queryClient]
  );

  // Similar handlers for 'completed' and 'failed' events...

  // Subscribe to events (auto-cleanup on unmount)
  useWebSocketSubscription('payment:created', handlePaymentCreated);
  useWebSocketSubscription('payment:updated', handlePaymentUpdated);
  useWebSocketSubscription('payment:completed', handlePaymentCompleted);
  useWebSocketSubscription('payment:failed', handlePaymentFailed);
}
```

**Usage in Component:**

```typescript
function PaymentsPage() {
  // Subscribe to all payment events
  usePaymentUpdates();

  // Use regular queries - will auto-refresh when events arrive
  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });

  return (
    <div>
      {payments.map(payment => (
        <PaymentCard key={payment.id} payment={payment} />
      ))}
    </div>
  );
}
```

**Data Flow:**

```
Backend Payment Service
  ↓ (publishes event to RabbitMQ)
API Gateway Event Bridge
  ↓ (receives event, broadcasts via WebSocket)
WebSocket Server
  ↓ (sends to all connected clients in 'payment:updated' room)
Browser WebSocket Client
  ↓ (receives message, triggers callback)
useWebSocketSubscription
  ↓ (invalidates queries)
TanStack Query
  ↓ (refetches from API)
Component Re-renders
  ↓ (with fresh data)
UI Updated
```

---

### Admin MFE Hook

**File:** `apps/admin-mfe/src/hooks/useDashboardUpdates.ts`

```typescript
export function useDashboardUpdates() {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const handlePaymentCreated = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Payment created:', payload);

    setRecentActivity(prev => [
      {
        id: crypto.randomUUID(),
        type: 'payment:created',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19), // Keep last 20 activities
    ]);
  }, []);

  // Similar for other events...

  // Subscribe to events
  useWebSocketSubscription('payment:created', handlePaymentCreated);
  useWebSocketSubscription('payment:updated', handlePaymentUpdated);
  useWebSocketSubscription('payment:completed', handlePaymentCompleted);
  useWebSocketSubscription('payment:failed', handlePaymentFailed);

  return { recentActivity };
}
```

**Usage in Component:**

```typescript
function AdminDashboard() {
  const { recentActivity } = useDashboardUpdates();

  return (
    <div>
      <h2>Recent Activity</h2>
      {recentActivity.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

---

## Server-Side Event Emission

**File:** `apps/api-gateway/src/websocket/event-bridge.ts`

```typescript
export class WebSocketEventBridge {
  private roomManager: RoomManager;
  private channel: Channel | null = null;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  async connect(): Promise<void> {
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitmqUrl);
    this.channel = await connection.createChannel();

    // Bind to payments exchange
    await this.channel.assertExchange('payments_events', 'topic', {
      durable: true,
    });

    // Create queue and bind to events
    const queue = await this.channel.assertQueue('ws_events', {
      exclusive: false,
    });

    // Listen for all events
    await this.channel.bindQueue(queue.queue, 'payments_events', '#');

    // Consume messages
    await this.channel.consume(queue.queue, msg => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        this.broadcastEvent(event);
        this.channel?.ack(msg);
      }
    });
  }

  private broadcastEvent(event: any): void {
    // Route event to appropriate room
    switch (event.type) {
      case 'payment:created':
        this.roomManager.broadcast('broadcast', {
          type: 'payment:created',
          payload: event.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'payment:updated':
        // Broadcast to all + user-specific room
        this.roomManager.broadcast('broadcast', {
          type: 'payment:updated',
          payload: event.data,
          timestamp: new Date().toISOString(),
        });

        if (event.data.userId) {
          this.roomManager.broadcast(`user:${event.data.userId}`, {
            type: 'payment:updated',
            payload: event.data,
          });
        }
        break;

      // Handle other event types...
    }
  }
}
```

---

## Connection State Flow

```
┌──────────────┐
│ disconnected │  (initial state)
└──────┬───────┘
       │ client.connect()
       ↓
┌──────────────┐
│ connecting   │  (attempting connection)
└──────┬───────┘
       │
       ├─ SUCCESS → ┌──────────────┐
       │            │ connected    │  (ready for messages)
       │            └──────┬───────┘
       │                   │
       │                   │ (network issue)
       │                   ↓
       │            ┌──────────────┐
       │            │ reconnecting │  (exponential backoff)
       │            └──────┬───────┘
       │                   │ (max attempts exceeded)
       │                   ↓
       │            ┌──────────────┐
       │            │ disconnected │
       │            └──────────────┘
       │
       └─ FAILURE → ┌──────────────┐
                    │ error        │
                    └──────┬───────┘
                           │
                           ↓
                    ┌──────────────┐
                    │ reconnecting │  (automatic retry)
                    └──────────────┘
```

---

## Connection Settings Summary

| Setting                | Current Value                                                 | Purpose                           |
| ---------------------- | ------------------------------------------------------------- | --------------------------------- |
| **URL**                | `wss://localhost/ws` (prod) or `ws://localhost:3000/ws` (dev) | WebSocket endpoint                |
| **Auth**               | JWT token from `useAuthStore`                                 | Connection authentication         |
| **Auto-connect**       | true                                                          | Automatically connect on mount    |
| **Auto-reconnect**     | true                                                          | Automatically retry on disconnect |
| **Reconnect Attempts** | 10                                                            | Max retry attempts                |
| **Initial Delay**      | 1000ms                                                        | First retry delay                 |
| **Max Delay**          | 30000ms                                                       | Cap retry delay at 30s            |
| **Ping Interval**      | 30000ms                                                       | Send heartbeat every 30s          |
| **Debug Mode**         | true (dev) / false (prod)                                     | Console logging                   |
| **Message Queuing**    | Enabled                                                       | Queue offline messages            |

---

## Key Insights

### ✅ What Works Well

1. **Single WebSocket Connection** - All MFEs share one connection through shell's provider
2. **Automatic Reconnection** - Exponential backoff with 10 retry attempts (max 30s delay)
3. **Token-Based Auth** - JWT passed in query parameter, auto-reconnects with new token
4. **Message Queuing** - Offline messages queued, flushed on reconnect
5. **Event Subscription** - Components subscribe to specific event types
6. **Query Integration** - Seamless TanStack Query cache invalidation
7. **Type Safety** - Full TypeScript support with proper interfaces
8. **Heartbeat Monitoring** - Ping/pong every 30s detects dead connections

### ⚠️ Considerations

1. **Single Point of Failure** - If shell WebSocket disconnects, all MFEs lose connection
2. **Token Expiration** - WebSocket needs to refresh token on reconnect
3. **Room Subscriptions** - All users auto-subscribe to 'broadcast' room (design decision)
4. **Message Format** - Consistent JSON with type/payload/timestamp structure
5. **Debug Logging** - Enabled in development (ping/pong every 30s in console)

### 📊 Event Flow

```
Backend Event → RabbitMQ → Event Bridge → WebSocket Room → Client Callback → Query Invalidate → Component Refetch → UI Update
```

---

## Configuration Files

### Environment Variables

```env
# Development
NX_WS_URL=ws://localhost:3000/ws
NODE_ENV=development

# Production
NX_WS_URL=wss://api.example.com/ws
NODE_ENV=production
```

### WebSocket URL Resolution

```typescript
// Shell Bootstrap
const wsUrl = process.env['NX_WS_URL'] || 'wss://localhost/ws';

// Payments MFE (Standalone)
const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';

// When loaded as remote: Uses shell's provider (no new connection)
```

---

## Testing WebSocket Connection

```bash
# Check if WebSocket is connecting
# Open browser DevTools → Console
# Look for: [WebSocketClient] Connecting to WebSocket server

# Verify heartbeat
# Watch for: [WebSocketClient] Ping sent (every 30s)

# Monitor connection state
# useWebSocket() hook returns: { status, isConnected }

# Subscribe to events
useWebSocketSubscription('payment:created', (payload) => {
  console.log('Received:', payload);
});
```

---

## Conclusion

The WebSocket implementation is **production-ready** with:

- ✅ Automatic reconnection and recovery
- ✅ Proper authentication and authorization
- ✅ Real-time data synchronization
- ✅ Type-safe React integration
- ✅ Seamless TanStack Query integration
- ✅ Comprehensive error handling

The ping/pong mechanism is **necessary and working as designed** - it keeps connections alive and detects dead connections automatically. Console logs are controlled by the `debug` flag and only appear in development mode.

---

**Document Created:** December 23, 2025  
**Next Steps:** Backend Hardening Implementation (Phase 1 - Week 1)
