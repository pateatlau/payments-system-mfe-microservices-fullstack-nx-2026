# MFE POC-3 Architecture & Implementation Plan

**Status:** Planning (Provisional)  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** React + Nx + Vite + Module Federation v2 + Backend API + nginx

---

## 1. Executive Summary

This document defines the provisional architecture and implementation plan for **POC-3** of the microfrontend (MFE) platform, extending POC-2 with:

- **nginx reverse proxy** (load balancing, SSL/TLS termination)
- **GraphQL API** (optional, alongside REST)
- **WebSocket** for real-time updates
- **Advanced caching strategies** (browser, CDN, service worker)
- **Performance optimizations** (code splitting, lazy loading, bundle optimization)
- **Enhanced observability** (Sentry error tracking, performance monitoring, infrastructure monitoring)
- **Basic analytics** (architecture-focused: MFE metrics, API patterns, system usage)
- **Session management** (cross-tab sync, cross-device sync - basic implementation)
- **Event hub enhancement** (production-ready event-based inter-microservices communication - see `docs/backend-event-hub-implementation-plan.md`)

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this microfrontend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, POC-3 focuses on:

- ✅ **Architecture validation** - Testing production-ready infrastructure patterns (nginx, WebSocket, caching, performance optimizations)
- ✅ **Practicality assessment** - Evaluating real-world challenges with infrastructure setup, session management, and advanced observability
- ✅ **Effort estimation** - Understanding complexity of infrastructure deployment, performance optimization, and monitoring setup
- ✅ **Security foundation** - Establishing infrastructure security patterns (nginx security, WebSocket security, session management security)
- ✅ **Incremental complexity** - Building from POC-2 to production-ready infrastructure and advanced features

This explains why payment operations remain **stubbed** (no actual PSP integration) - the focus is on validating the architecture and patterns with production-ready infrastructure, not delivering complete payment processing (which will come in MVP/Production phases). Additional POC phases beyond POC-3 may be added as needed to continue architecture validation.

**Scope:** POC-3 focuses on production readiness, performance optimization, infrastructure improvements, advanced features for scalability and reliability, and basic session synchronization across tabs and devices. Payment operations remain stubbed (no actual PSP integration - will be implemented in MVP/Production).

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MFE Platform (POC-3)             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Shell App   │  │  Auth MFE   │  │ Payments MFE │      │
│  │  (Host)      │  │  (Remote)   │  │  (Remote)    │      │
│  │  Port 4200   │  │  Port 4201  │  │  Port 4202   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         │ Module Federation v2 (BIMF)         │               │
│         │                  │                  │               │
│         └──────────┬───────┬──────────────────┘               │
│                    │       │                                  │
│                    ▼       ▼                                  │
│              ┌──────────────────┐                            │
│              │  Shared Libraries │                           │
│              │  - shared-utils   │                           │
│              │  - shared-ui      │                           │
│              │  - shared-types  │                           │
│              │  - shared-auth-store │                       │
│              │  - shared-header-ui │                        │
│              │  - shared-api-client │                        │
│              │  - shared-event-bus │                        │
│              │  - shared-design-system │                    │
│              │  - shared-graphql-client │ (NEW)              │
│              │  - shared-websocket │ (NEW)                 │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  nginx (POC-3) │
                    │  (Reverse Proxy, │
                    │   Load Balancing, │
                    │   SSL/TLS)      │
                    └───────┬─────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    │  - REST API   │
                    │  - GraphQL (NEW) │
                    │  - WebSocket (NEW) │
                    │  - Auth Service │
                    │  - Payments Service │
                    │  - Admin Service │
                    │  - Profile Service │
                    └───────────────┘
```

### 2.2 Technology Stack

| Category              | Technology                  | Version     | Rationale                                   |
| --------------------- | --------------------------- | ----------- | ------------------------------------------- |
| **Monorepo**          | Nx                          | Latest      | Scalable, build caching, task orchestration |
| **Runtime**           | Node.js                     | 24.11.x LTS | Latest LTS                                  |
| **Framework**         | React                       | 19.2.0      | Latest stable                               |
| **Bundler**           | Vite                        | 6.x         | Fast dev server, excellent DX               |
| **Module Federation** | @module-federation/enhanced | 0.21.6      | BIMF (Module Federation v2)                 |
| **Language**          | TypeScript                  | 5.9.x       | Type safety                                 |
| **Package Manager**   | pnpm                        | 9.x         | Recommended for Nx                          |
| **Routing**           | React Router                | 7.x         | Latest, production-ready                    |
| **State (Client)**    | Zustand                     | 4.5.x       | Lightweight, scalable                       |
| **State (Server)**    | TanStack Query              | 5.x         | Server state management                     |
| **Inter-MFE Comm**    | Event Bus                   | Custom      | Decoupled MFE communication                 |
| **Styling**           | Tailwind CSS                | 4.0+        | Latest, fast builds                         |
| **Design System**     | shadcn/ui                   | Latest      | Production-ready component library          |
| **API (REST)**        | Axios                       | 1.7.x       | Production-ready                            |
| **API (GraphQL)**     | Apollo Client / urql        | Latest      | GraphQL client (optional)                   |
| **Real-time**         | WebSocket                   | Native      | Real-time updates                           |
| **Caching**           | Service Worker / Workbox    | Latest      | Advanced caching strategies                 |
| **Infrastructure**    | nginx                       | Latest      | Reverse proxy, load balancing, SSL          |
| **Monitoring**        | Sentry                      | Latest      | Error tracking, performance monitoring      |
| **Form Handling**     | React Hook Form             | 7.52.x      | Industry standard                           |
| **Validation**        | Zod                         | 3.23.x      | Type-safe validation                        |
| **Storage**           | localStorage                | Native      | Browser API                                 |
| **Error Handling**    | react-error-boundary        | 4.0.13      | React 19 compatible                         |
| **Testing**           | Vitest                      | 2.0.x       | Fast, Vite-native                           |
| **E2E Testing**       | Playwright                  | Latest      | Web E2E testing                             |
| **Code Quality**      | ESLint                      | 9.x         | Latest, flat config                         |
| **Formatting**        | Prettier                    | 3.3.x       | Code formatting                             |
| **Type Checking**     | TypeScript ESLint           | 8.x         | TS-specific linting                         |

---

## 3. Project Structure

### 3.1 Nx Workspace Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/              # Host application
│   ├── auth-mfe/           # Auth remote
│   ├── payments-mfe/        # Payments remote
│   └── admin-mfe/          # Admin remote
├── libs/
│   ├── shared-utils/       # Shared utilities
│   ├── shared-ui/          # Shared UI components
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-auth-store/  # Auth Zustand store
│   ├── shared-header-ui/  # Universal header component
│   ├── shared-api-client/ # REST API client
│   ├── shared-event-bus/  # Event bus
│   ├── shared-design-system/ # Design system & components
│   ├── shared-graphql-client/ # NEW: GraphQL client (optional)
│   ├── shared-websocket/   # NEW: WebSocket client
│   ├── shared-session-sync/ # NEW: Session sync (cross-tab, cross-device)
│   └── shared-analytics/   # NEW: Basic analytics (architecture-focused)
├── tools/                  # Nx generators, executors
├── nginx/                  # NEW: nginx configuration
├── nx.json                 # Nx configuration
├── package.json
└── pnpm-workspace.yaml     # pnpm workspace config
```

---

## 4. POC-3 Requirements

### 4.1 nginx Reverse Proxy

**Purpose:** Production-ready reverse proxy, load balancing, and SSL/TLS termination

**Scope:**

- Reverse proxy for API Gateway
- Load balancing across service instances
- SSL/TLS termination
- Static file serving
- Rate limiting at infrastructure level
- Request routing and path rewriting
- Caching headers
- Compression (gzip, brotli)

**Configuration:**

```nginx
# nginx/nginx.conf
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    keepalive 32;
}

upstream shell_app {
    server shell:4200;
}

upstream auth_mfe {
    server auth-mfe:4201;
}

upstream payments_mfe {
    server payments-mfe:4202;
}

upstream admin_mfe {
    server admin-mfe:4203;
}

server {
    listen 80;
    server_name app.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    # SSL/TLS Configuration (POC-3: Self-signed certificates)
    # Note: Real certificates will be implemented in MVP
    ssl_certificate /etc/nginx/ssl/self-signed-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/self-signed-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    # SSL stapling disabled for self-signed certificates (will be enabled in MVP)
    # ssl_stapling on;
    # ssl_stapling_verify on;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API Gateway
    location /api {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }

    # Shell App
    location / {
        proxy_pass http://shell_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Auth MFE
    location /auth-mfe {
        proxy_pass http://auth_mfe;
        proxy_set_header Host $host;
    }

    # Payments MFE
    location /payments-mfe {
        proxy_pass http://payments_mfe;
        proxy_set_header Host $host;
    }

    # Admin MFE
    location /admin-mfe {
        proxy_pass http://admin_mfe;
        proxy_set_header Host $host;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

**Self-Signed Certificate Generation (POC-3):**

```bash
# Generate self-signed certificate for POC-3
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/self-signed-key.pem \
  -out /etc/nginx/ssl/self-signed-cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=app.example.com"
```

**Note:**

- **POC-3:** Self-signed certificates for HTTPS (development/testing)
- **MVP:** Real certificates (Let's Encrypt, commercial CA, or internal CA)

**Deliverables:**

- ✅ nginx configuration files
- ✅ SSL/TLS setup with self-signed certificates
- ✅ Load balancing configured
- ✅ Rate limiting configured
- ✅ Caching headers configured
- ✅ Compression enabled

---

### 4.2 GraphQL API (Optional)

**Purpose:** Add GraphQL alongside REST API for flexible data fetching

**Scope:**

- GraphQL client library
- GraphQL queries and mutations
- GraphQL subscriptions (real-time)
- Code generation (GraphQL Code Generator)
- Type-safe GraphQL operations

**Package to Create:**

- `libs/shared-graphql-client` - GraphQL client library

**Technology Options:**

- **Apollo Client** - Full-featured, production-ready
- **urql** - Lightweight, modern alternative

**Implementation:**

```typescript
// libs/shared-graphql-client/src/index.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useAuthStore } from '@web-mfe/shared-auth-store';

const httpLink = createHttpLink({
  uri: process.env['NX_GRAPHQL_URL'] || 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().user?.accessToken;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

**Usage:**

```typescript
// apps/payments-mfe/src/hooks/usePaymentsGraphQL.ts
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_PAYMENTS = gql`
  query GetPayments {
    payments {
      id
      amount
      description
      status
      createdAt
    }
  }
`;

export const usePaymentsGraphQL = () => {
  const { data, loading, error } = useQuery(GET_PAYMENTS);
  return { payments: data?.payments, loading, error };
};
```

**Deliverables:**

- ✅ GraphQL client library created
- ✅ GraphQL queries and mutations implemented
- ✅ Type-safe GraphQL operations
- ✅ GraphQL subscriptions (if needed)

---

### 4.3 WebSocket for Real-Time Updates

**Purpose:** Real-time updates for payments, notifications, and live data

**Scope:**

- WebSocket client library
- Connection management
- Reconnection logic
- Message handling
- Event integration with event bus

**Package to Create:**

- `libs/shared-websocket` - WebSocket client library

**Features:**

- Automatic reconnection
- Connection state management
- Message queuing
- Type-safe messages
- Integration with event bus

**Implementation:**

```typescript
// libs/shared-websocket/src/index.ts
import { EventBus } from '@web-mfe/shared-event-bus';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      EventBus.emit('websocket:connected', {});
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      EventBus.emit('websocket:error', { error });
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect(url);
    };
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'payment:updated':
        EventBus.emit('payments:updated', message.data);
        break;
      case 'notification:new':
        EventBus.emit('notification:new', message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private reconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.ws?.close();
  }
}

export const wsClient = new WebSocketClient();
```

**Usage:**

```typescript
// apps/payments-mfe/src/hooks/useWebSocket.ts
import { useEffect } from 'react';
import { wsClient } from '@web-mfe/shared-websocket';
import { EventBus } from '@web-mfe/shared-event-bus';

export const useWebSocket = () => {
  useEffect(() => {
    const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';
    wsClient.connect(wsUrl);

    // Subscribe to payment updates
    const handlePaymentUpdate = (data: any) => {
      // Update local state or invalidate queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    };

    EventBus.on('payments:updated', handlePaymentUpdate);

    return () => {
      wsClient.disconnect();
      EventBus.off('payments:updated', handlePaymentUpdate);
    };
  }, []);
};
```

**Deliverables:**

- ✅ WebSocket client library created
- ✅ Connection management working
- ✅ Reconnection logic implemented
- ✅ Integration with event bus
- ✅ Real-time updates working

---

### 4.4 Advanced Caching Strategies

**Purpose:** Improve performance with multi-level caching

**Scope:**

- **Browser caching** - HTTP cache headers, ETags
- **Service Worker** - Offline support, cache-first strategies
- **CDN caching** - Static assets, API responses (if applicable)
- **Application-level caching** - TanStack Query cache optimization
- **Memory caching** - In-memory cache for frequently accessed data

**Service Worker Implementation:**

```typescript
// apps/shell/public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses (stale-while-revalidate)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?v=${Date.now()}`;
        },
      },
    ],
  })
);

// Cache static assets (cache-first)
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
  })
);
```

**TanStack Query Cache Optimization:**

```typescript
// Optimize query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

**Deliverables:**

- ✅ Service Worker implemented
- ✅ Browser caching configured
- ✅ CDN caching configured (if applicable)
- ✅ Application-level caching optimized
- ✅ Offline support working

---

### 4.5 Performance Optimizations

**Purpose:** Optimize bundle sizes, loading times, and runtime performance

**Scope:**

- **Code splitting** - Route-based and component-based splitting
- **Lazy loading** - Dynamic imports for remotes and components
- **Bundle optimization** - Tree shaking, minification, compression
- **Image optimization** - Lazy loading, responsive images, WebP
- **Resource hints** - Preload, prefetch, preconnect
- **Virtual scrolling** - For large lists
- **Memoization** - React.memo, useMemo, useCallback

**Code Splitting:**

```typescript
// apps/shell/src/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

// Lazy load remotes
const PaymentsPage = lazy(() => import('payments-mfe/PaymentsPage'));
const AdminDashboard = lazy(() => import('admin-mfe/AdminDashboard'));

const router = createBrowserRouter([
  {
    path: '/payments',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <PaymentsPage />
      </Suspense>
    ),
  },
]);
```

**Bundle Optimization:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          ui: ['@web-mfe/shared-design-system'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

**Deliverables:**

- ✅ Code splitting implemented
- ✅ Lazy loading working
- ✅ Bundle optimization configured
- ✅ Performance metrics improved
- ✅ Lighthouse scores improved

---

### 4.6 Enhanced Observability & Basic Analytics

**Purpose:** Production-ready observability and architecture-focused analytics

**Scope:**

- **Sentry integration** - Error tracking, performance monitoring, user session replay
- **Performance metrics** - Core Web Vitals, custom metrics
- **Infrastructure monitoring** - nginx access logs, WebSocket connections, cache metrics, Service Worker status
- **Basic analytics** - Architecture-focused event tracking (MFE metrics, API patterns, system usage)
- **Monitoring dashboard** - Centralized dashboard for errors, performance, infrastructure, analytics

**Note:** Analytics in POC-3 are architecture-focused (system usage, technical metrics) for architecture validation. Product analytics (user behavior, business metrics) will be implemented in MVP. See `docs/observability-analytics-phasing.md` for detailed phasing strategy.

**Sentry Setup:**

```typescript
// apps/shell/src/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env['NX_SENTRY_DSN'],
  environment: process.env['NX_ENV'] || 'development',
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Error Boundary Integration:**

```typescript
// apps/shell/src/ErrorBoundary.tsx
import { ErrorBoundary } from '@sentry/react';
import { Button, Alert } from '@web-mfe/shared-design-system';

function ErrorFallback({ error, resetError }) {
  return (
    <Alert variant="destructive">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <Button onClick={resetError}>Try again</Button>
    </Alert>
  );
}

export function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      showDialog
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Performance Monitoring:**

```typescript
// Monitor Core Web Vitals
import { onCLS, onFID, onLCP } from 'web-vitals';
import * as Sentry from '@sentry/react';

onCLS((metric) => {
  Sentry.metrics.distribution('web-vitals.cls', metric.value);
});

onFID((metric) => {
  Sentry.metrics.distribution('web-vitals.fid', metric.value);
});

onLCP((metric) => {
  Sentry.metrics.distribution('web-vitals.lcp', metric.value);
});
```

**Infrastructure Monitoring:**

```typescript
// libs/shared-infrastructure-monitoring/src/index.ts
class InfrastructureMonitor {
  trackNginxAccess(log: any) {
    // Track nginx access patterns
    analytics.trackEvent('infrastructure:nginx-access', {
      status: log.status,
      method: log.method,
      path: log.path,
      duration: log.duration,
    });
  }

  trackWebSocketConnection(status: 'connected' | 'disconnected' | 'error') {
    analytics.trackEvent('infrastructure:websocket', { status });
  }

  trackCacheHit(cacheType: 'browser' | 'cdn' | 'service-worker', hit: boolean) {
    analytics.trackEvent('infrastructure:cache', { cacheType, hit });
  }

  trackServiceWorkerStatus(status: 'activated' | 'installed' | 'error') {
    analytics.trackEvent('infrastructure:service-worker', { status });
  }
}

export const infrastructureMonitor = new InfrastructureMonitor();
```

**Basic Analytics (Architecture-Focused):**

```typescript
// libs/shared-analytics/src/index.ts
class BasicAnalytics {
  trackEvent(event: string, properties?: Record<string, any>) {
    // Only track architecture-related events in POC-3
    const architectureEvents = [
      'mfe:loaded',
      'mfe:load-failed',
      'remote:loaded',
      'api:call',
      'event-bus:event',
      'websocket:connected',
      'cache:hit',
      'cache:miss',
      'infrastructure:nginx-access',
      'infrastructure:websocket',
      'infrastructure:cache',
      'infrastructure:service-worker',
    ];

    if (architectureEvents.includes(event)) {
      // Send to analytics service (simple endpoint or Sentry)
      this.sendEvent(event, properties);
    }
  }

  private sendEvent(event: string, properties?: Record<string, any>) {
    // Simple implementation - can be enhanced in MVP
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, properties, timestamp: Date.now() }),
    }).catch(() => {
      // Fail silently in POC-3
    });
  }
}

export const analytics = new BasicAnalytics();
```

**Usage Examples:**

```typescript
// Track MFE load
analytics.trackEvent('mfe:loaded', { mfe: 'payments', duration: 1200 });

// Track API call pattern
analytics.trackEvent('api:call', {
  endpoint: '/payments',
  method: 'GET',
  duration: 150,
});

// Track cache performance
analytics.trackEvent('cache:hit', {
  cacheType: 'service-worker',
  resource: '/assets/app.js',
});

// Track WebSocket connection
infrastructureMonitor.trackWebSocketConnection('connected');
```

**Monitoring Dashboard:**

- Error dashboard (Sentry integration)
- Performance dashboard (Core Web Vitals, custom metrics)
- Infrastructure dashboard (nginx, WebSocket, cache, Service Worker)
- Analytics dashboard (architecture metrics only)
- Health check dashboard

**Deliverables:**

- ✅ Sentry integrated
- ✅ Error tracking working
- ✅ Performance monitoring working
- ✅ User session replay configured
- ✅ Infrastructure monitoring implemented
- ✅ Basic analytics library created (architecture-focused)
- ✅ Monitoring dashboard created

---

### 4.7 Event Hub Enhancement (Backend)

**Purpose:** Production-ready event-based inter-microservices communication

**Scope:**

- Enhanced event hub with RabbitMQ (or Redis Streams)
- Message persistence and guaranteed delivery
- Retry mechanism with exponential backoff
- Dead letter queue (DLQ) for failed events
- Event replay capability
- Event authentication and authorization
- Enhanced observability (tracing, correlation IDs)

**Note:** This is a backend implementation. The event hub enables asynchronous, event-based communication between microservices (Auth, Payments, Admin, Profile services). Frontend integration is via REST API and WebSocket (for real-time updates). See `docs/backend-event-hub-implementation-plan.md` for detailed implementation plan.

**Deliverables:**

- ✅ Production-ready event hub (RabbitMQ-based)
- ✅ Message persistence working
- ✅ Guaranteed delivery working
- ✅ Retry mechanism working
- ✅ Dead letter queue working
- ✅ Event authentication/authorization working
- ✅ Event tracing working

---

## 5. High-Level Architecture

### 5.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MFE Platform (POC-3)             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Shell App   │  │  Auth MFE   │  │ Payments MFE │      │
│  │  (Host)      │  │  (Remote)   │  │  (Remote)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         │ Module Federation v2 (BIMF)         │               │
│         │                  │                  │               │
│         └──────────┬───────┬──────────────────┘               │
│                    │       │                                  │
│                    ▼       ▼                                  │
│              ┌──────────────────┐                            │
│              │  Shared Libraries │                           │
│              │  - Design System │                           │
│              │  - Event Bus     │                           │
│              │  - API Client    │                           │
│              │  - GraphQL Client │ (NEW)                     │
│              │  - WebSocket     │ (NEW)                     │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  nginx (POC-3) │
                    │  - Reverse Proxy │
                    │  - Load Balancing │
                    │  - SSL/TLS      │
                    │  - Rate Limiting │
                    └───────┬─────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    │  - REST API   │
                    │  - GraphQL (NEW) │
                    │  - WebSocket (NEW) │
                    └───────────────┘
```

---

## 6. Implementation Plan

### Phase 1: Infrastructure & nginx (Week 1)

**Tasks:**

1. **Setup nginx**

   - Install and configure nginx
   - Setup reverse proxy configuration
   - Configure load balancing
   - Setup SSL/TLS with self-signed certificates
   - Configure rate limiting
   - Setup caching headers
   - Enable compression
   - Note: Real certificates will be implemented in MVP

2. **Testing**

   - Test reverse proxy
   - Test load balancing
   - Test SSL/TLS
   - Test rate limiting
   - Performance testing

**Deliverables:**

- ✅ nginx configured and working
- ✅ SSL/TLS setup with self-signed certificates
- ✅ Load balancing working
- ✅ Rate limiting configured
- ⚠️ Real certificates planned for MVP

---

### Phase 2: GraphQL Integration (Week 2) - Optional

**Tasks:**

1. **Create GraphQL Client Library**

   ```bash
   nx generate @nx/js:library shared-graphql-client \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

2. **Implement GraphQL Client**

   - Setup Apollo Client or urql
   - Configure authentication
   - Setup code generation
   - Create type-safe queries and mutations

3. **Migrate Selected APIs**

   - Identify APIs to migrate to GraphQL
   - Implement GraphQL queries
   - Implement GraphQL mutations
   - Test GraphQL operations

**Deliverables:**

- ✅ GraphQL client library created
- ✅ GraphQL queries and mutations working
- ✅ Type-safe GraphQL operations
- ✅ Selected APIs migrated to GraphQL

---

### Phase 3: WebSocket Integration (Week 3)

**Tasks:**

1. **Create WebSocket Client Library**

   ```bash
   nx generate @nx/js:library shared-websocket \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

2. **Implement WebSocket Client**

   - Connection management
   - Reconnection logic
   - Message handling
   - Integration with event bus

3. **Integrate in MFEs**

   - Add WebSocket to Payments MFE
   - Add WebSocket to Admin MFE
   - Real-time payment updates
   - Real-time notifications

**Deliverables:**

- ✅ WebSocket client library created
- ✅ Connection management working
- ✅ Real-time updates working
- ✅ Integration with event bus complete

---

### Phase 4: Caching & Performance (Week 4)

**Tasks:**

1. **Service Worker**

   - Setup Workbox
   - Configure caching strategies
   - Implement offline support
   - Test service worker

2. **Performance Optimizations**

   - Implement code splitting
   - Setup lazy loading
   - Optimize bundle sizes
   - Image optimization
   - Resource hints

3. **Caching Configuration**

   - Browser caching headers
   - CDN caching (if applicable)
   - TanStack Query cache optimization
   - Memory caching

**Deliverables:**

- ✅ Service Worker implemented
- ✅ Code splitting working
- ✅ Lazy loading working
- ✅ Performance metrics improved
- ✅ Caching strategies implemented

---

### Phase 5: Session Management & Monitoring (Week 5)

**Tasks:**

1. **Session Management (Basic)**

   - Create session sync library (`shared-session-sync`)
   - Implement basic cross-tab sync (BroadcastChannel API + localStorage fallback)
   - Implement basic cross-device sync (WebSocket + polling fallback)
   - Basic device registration (device ID in localStorage)
   - Integration with auth store
   - Integration with session timeout
   - Basic error handling

2. **Backend Session Management (Basic)**

   - Simple device registration endpoint
   - Basic session store (in-memory or simple DB)
   - WebSocket session events (basic)
   - Device ID tracking

3. **Enhanced Observability**

   - Setup Sentry
   - Configure error tracking
   - Setup performance monitoring
   - Configure session replay
   - Implement infrastructure monitoring (nginx, WebSocket, cache, Service Worker)
   - Test error reporting

4. **Basic Analytics (Architecture-Focused)**

   - Create `shared-analytics` library
   - Implement architecture-focused event tracking
   - Track MFE metrics, API patterns, system usage
   - Integrate with Sentry for error analytics
   - Create analytics dashboard (architecture metrics only)

5. **Performance Monitoring**

   - Core Web Vitals tracking
   - Custom performance metrics
   - Performance dashboards

6. **Testing & Refinement**

   - Test cross-tab sync (login, logout, token refresh, session timeout)
   - Test cross-device sync (basic - 2 devices)
   - Performance testing
   - Load testing
   - Security testing
   - Final optimizations

7. **Documentation**

   - Update architecture docs
   - Document nginx configuration
   - Document GraphQL usage (if implemented)
   - Document WebSocket usage
   - Document caching strategies
   - Document session management (cross-tab, cross-device)
   - Document monitoring setup

**Deliverables:**

- ✅ Basic cross-tab session sync implemented
- ✅ Basic cross-device session sync implemented
- ✅ Basic backend session management
- ✅ Sentry integrated and working
- ✅ Performance monitoring working
- ✅ Infrastructure monitoring implemented
- ✅ Basic analytics library created (architecture-focused)
- ✅ Monitoring dashboard created
- ✅ All optimizations complete
- ✅ Documentation updated

**Note:** Session sync features are basic implementations in POC-3. Enhanced features (error handling, retry logic, device management UI, etc.) will be added in MVP. Hardened features (security, rate limiting, compliance) will be added in Production.

---

## 7. Key Technical Decisions

### 7.1 nginx Reverse Proxy

**Decision:** Use nginx for reverse proxy, load balancing, and SSL/TLS

**Reference:** See `docs/adr/poc-3/0001-nginx-reverse-proxy.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Production-ready infrastructure
- Industry standard
- Excellent performance
- SSL/TLS termination
- Load balancing
- Rate limiting
- Caching

**Carry Forward:** ✅ Yes - Production-ready infrastructure

---

### 7.2 GraphQL (Optional)

**Decision:** Add GraphQL alongside REST API (optional)

**Rationale:**

- Flexible data fetching
- Reduced over-fetching
- Type-safe operations
- Real-time subscriptions
- Better for complex queries

**Considerations:**

- GraphQL adds complexity
- May not be needed for all use cases
- REST API remains primary

**Carry Forward:** ✅ Yes - If implemented, production-ready

---

### 7.3 WebSocket for Real-Time

**Decision:** Use WebSocket for real-time updates

**Reference:** See `docs/adr/poc-3/0002-websocket-for-realtime.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Real-time updates without polling
- Better user experience
- Efficient for live data
- Industry standard

**Carry Forward:** ✅ Yes - Production-ready, improves UX

---

### 7.4 Advanced Caching

**Decision:** Multi-level caching strategy

**Rationale:**

- Improved performance
- Reduced server load
- Better user experience
- Offline support

**Carry Forward:** ✅ Yes - Production-ready, essential for performance

---

### 7.5 Performance Optimizations

**Decision:** Comprehensive performance optimizations

**Rationale:**

- Better user experience
- Faster load times
- Lower bandwidth usage
- Better SEO

**Carry Forward:** ✅ Yes - Production-ready, essential for production

---

### 7.6 Advanced Monitoring

**Decision:** Use Sentry for error tracking and performance monitoring

**Rationale:**

- Production-ready monitoring
- Error tracking
- Performance insights
- User session replay
- Industry standard

**Carry Forward:** ✅ Yes - Production-ready, essential for production

---

## 8. Success Criteria

✅ **Functional Requirements:**

- [ ] nginx reverse proxy working
- [ ] SSL/TLS configured with self-signed certificates
- [ ] Load balancing working
- [ ] WebSocket real-time updates working
- [ ] GraphQL working (if implemented)
- [ ] Service Worker working
- [ ] Offline support working
- [ ] Performance optimizations complete
- [ ] Enhanced observability working (Sentry, infrastructure monitoring)
- [ ] Basic analytics working (architecture-focused)
- [ ] Monitoring dashboard working

✅ **Technical Requirements:**

- [ ] nginx configured correctly with self-signed certificates
- [ ] WebSocket client implemented
- [ ] GraphQL client implemented (if applicable)
- [ ] Service Worker implemented
- [ ] Cross-tab session sync library implemented
- [ ] Cross-device session sync implemented (basic)
- [ ] Basic backend session management
- [ ] Code splitting working
- [ ] Lazy loading working
- [ ] Sentry integrated
- [ ] Infrastructure monitoring implemented
- [ ] Basic analytics library implemented (architecture-focused)
- [ ] Monitoring dashboard created
- [ ] Performance metrics improved

✅ **Quality Requirements:**

- [ ] Lighthouse scores improved
- [ ] Core Web Vitals optimized
- [ ] Bundle sizes optimized
- [ ] Error tracking working
- [ ] Performance monitoring working
- [ ] Documentation updated

---

## 9. Security Strategy (Banking-Grade)

**Context:** This platform is designed for a large banking institution, requiring enterprise-grade security.

**Reference:** See `docs/security-strategy-banking.md` for comprehensive security strategy.

### 9.1 POC-3 Security Features (Infrastructure & Production-Ready)

**Scope:** Infrastructure security and production-ready security hardening

**Security Features:**

1. **Infrastructure Security (nginx)**

   - ✅ SSL/TLS 1.2+ only with strong cipher suites
   - ✅ Self-signed certificates (POC-3)
   - ⚠️ HSTS disabled for self-signed (will be enabled in MVP with real certificates)
   - ✅ Rate limiting (DDoS protection)
   - ✅ IP whitelisting (admin endpoints)
   - ✅ Request size limits (DoS prevention)
   - ✅ Security headers enforcement
   - ⚠️ SSL stapling disabled (will be enabled in MVP with real certificates)
   - ⚠️ Real certificates planned for MVP

2. **WebSocket Security**

   - ✅ WSS only (secure WebSocket)
   - ✅ WebSocket authentication
   - ✅ Message validation and sanitization
   - ✅ Rate limiting for WebSocket messages
   - ✅ Message size limits
   - ✅ Type whitelisting

3. **GraphQL Security (If Implemented)**

   - ✅ Query depth limiting (DoS prevention)
   - ✅ Query complexity limiting
   - ✅ Rate limiting
   - ✅ Input validation
   - ✅ Error handling

4. **Cache Security**

   - ✅ Encrypted cache for sensitive data
   - ✅ Cache key validation (prevent cache poisoning)
   - ✅ TTL for sensitive data (shorter TTL)
   - ✅ Cache invalidation on logout
   - ✅ No caching of sensitive endpoints

5. **Advanced Monitoring & Threat Detection**

   - ✅ Real-time threat detection
   - ✅ Brute force detection
   - ✅ Anomaly detection
   - ✅ Security alerting
   - ✅ Sentry integration
   - ✅ SOC integration preparation

6. **Security Hardening**
   - ✅ HTTPS enforcement (self-signed certificates in POC-3)
   - ✅ Session timeout
   - ✅ Secure cookies
   - ✅ CSP verification
   - ✅ Security header verification
   - ⚠️ Real certificates planned for MVP

**Implementation:**

- All security features implemented in Phase 1-5
- Infrastructure security in Phase 1 (nginx)
- WebSocket security in Phase 3
- GraphQL security in Phase 2 (if implemented)
- Cache security in Phase 4
- Threat detection in Phase 5
- Security hardening throughout all phases
- Session management security in Phase 5 (basic)

**Note:** See `docs/security-strategy-banking.md` for comprehensive security strategy. MVP will add MFA and advanced security monitoring.

**Compliance Progress:**

- ✅ PCI DSS preparation (payment data security - payment flows stubbed, no actual PSP)
- ✅ GDPR compliance (data protection)
- ✅ Banking regulations (enhanced)
- ✅ SOC 2 preparation (advanced)
- 🔄 Security certifications (MVP)

**Next Phase (MVP):**

- 🔄 Multi-Factor Authentication (MFA)
- 🔄 Advanced security monitoring (full SOC)
- 🔄 Penetration testing
- 🔄 Full compliance certification

---

## 10. CI/CD & Deployment Strategy

**Reference:** See `docs/cicd-deployment-recommendation.md` for comprehensive CI/CD strategy.

### 10.1 POC-3 CI/CD (Full CI/CD)

**Scope:** Production-ready CI/CD with infrastructure automation and advanced features

**Rationale:**

- Production readiness requires full pipeline
- Infrastructure (nginx, SSL/TLS) needs automation
- Performance and monitoring need integration
- Scalability requires multi-environment support
- Safe deployment strategies needed

**CI/CD Components:**

1. **All POC-2 Components** (carried forward)

   - ✅ Automated testing (unit, integration, E2E)
   - ✅ Build verification
   - ✅ Code quality checks (ESLint + SonarQube)
   - ✅ SAST (Static Application Security Testing)
   - ✅ Basic staging deployment
   - ✅ Dependency scanning

   **Reference:** See `docs/sast-implementation-plan.md` for detailed SAST setup (Git hooks: Prettier + ESLint, CI/CD: ESLint + SonarQube + Dependency/Secret scanning).

2. **Multi-Environment Pipeline**

   - ✅ Development environment
   - ✅ Staging environment
   - ✅ Production environment
   - ✅ Environment-specific configurations
   - ✅ Environment promotion workflow

3. **Infrastructure Deployment**

   - ✅ nginx configuration deployment
   - ✅ SSL/TLS certificate management
   - ✅ Load balancer configuration
   - ✅ CDN configuration
   - ✅ Infrastructure as Code (IaC)

4. **Advanced Testing**

   - ✅ Performance testing (Lighthouse CI)
   - ✅ Load testing
   - ✅ Security scanning (OWASP ZAP, Snyk)
   - ✅ Bundle size monitoring
   - ✅ Accessibility testing

5. **Deployment Strategies**

   - ✅ Blue-green deployment
   - ✅ Canary releases
   - ✅ Rollback automation
   - ✅ Health checks
   - ✅ Zero-downtime deployments

6. **Monitoring Integration**

   - ✅ Sentry integration
   - ✅ Performance monitoring
   - ✅ Error tracking
   - ✅ Deployment notifications
   - ✅ Health check monitoring

7. **CDN Deployment**
   - ✅ Static asset deployment
   - ✅ Cache invalidation
   - ✅ Version management
   - ✅ Asset optimization

**Implementation:**

#### Enhanced GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]

jobs:
  # All POC-2 jobs (test, build, e2e)
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=test --all
      - run: pnpm nx run-many --target=lint --all
      - run: pnpm nx run-many --target=type-check --all

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=build --all

      - uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  e2e:
    runs-on: ubuntu-latest
    needs: build
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=build --all
      - run: pnpm nx run-many --target=e2e --all

  security-scan:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'https://staging.example.com'

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, build, e2e]
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy nginx Configuration
        run: |
          # Deploy nginx config to staging
          ansible-playbook -i staging deploy-nginx.yml

      - name: Deploy MFEs to Staging
        run: |
          # Deploy MFEs to staging server
          rsync -avz dist/ staging-server:/var/www/app/

      - name: Run Health Checks
        run: |
          curl -f https://staging.example.com/health || exit 1

  performance-test:
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse CI
        run: |
          pnpm nx run shell:lighthouse
          pnpm nx run shell:bundle-size-check

      - name: Run Load Tests
        run: |
          # Run k6 or similar load tests
          k6 run load-test.js

  deploy-production:
    runs-on: ubuntu-latest
    needs: [deploy-staging, performance-test, security-scan]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to CDN
        run: |
          # Deploy static assets to CDN
          aws s3 sync dist/ s3://cdn-bucket/app/
          aws cloudfront create-invalidation --distribution-id $CDN_ID --paths "/*"

      - name: Deploy nginx Configuration
        run: |
          # Deploy nginx config to production
          ansible-playbook -i production deploy-nginx.yml

      - name: Blue-Green Deployment
        run: |
          # Blue-green deployment strategy
          ./scripts/blue-green-deploy.sh

      - name: Run Health Checks
        run: |
          curl -f https://app.example.com/health || exit 1

      - name: Notify Deployment
        run: |
          # Send deployment notification to Slack/Teams
          curl -X POST $SLACK_WEBHOOK -d '{"text":"Deployment successful"}'
```

#### Infrastructure as Code

```yaml
# infrastructure/nginx-deploy.yml
- name: Deploy nginx configuration
  hosts: nginx-servers
  tasks:
    - name: Copy nginx config
      copy:
        src: nginx/nginx.conf
        dest: /etc/nginx/nginx.conf
    - name: Test nginx config
      command: nginx -t
    - name: Reload nginx
      systemd:
        name: nginx
        state: reloaded
```

#### CDN Deployment Script

```typescript
// scripts/deploy-cdn.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

async function deployToCDN() {
  // Upload build artifacts to S3
  const s3Client = new S3Client({ region: 'us-east-1' });
  await s3Client.send(
    new PutObjectCommand({
      Bucket: 'cdn-bucket',
      Key: 'app/',
      Body: buildArtifacts,
    })
  );

  // Invalidate CloudFront cache
  const cloudfrontClient = new CloudFrontClient({ region: 'us-east-1' });
  await cloudfrontClient.send(
    new CreateInvalidationCommand({
      DistributionId: process.env.CDN_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
        CallerReference: Date.now().toString(),
      },
    })
  );
}
```

**Deliverables:**

- ✅ Full CI/CD pipeline configured
- ✅ Multi-environment support
- ✅ Infrastructure automation
- ✅ Performance testing integrated
- ✅ Security scanning integrated
- ✅ Deployment strategies implemented
- ✅ Monitoring integration
- ✅ CDN deployment working

**Future Enhancements (MVP/Production):**

- 🔄 Advanced analytics integration
- 🔄 A/B testing framework
- 🔄 Multi-region deployment
- 🔄 Kubernetes deployment (if needed)
- 🔄 Advanced CI/CD pipelines

---

## 11. Out of Scope (Future)

**Not Included in POC-3:**

- Advanced analytics (beyond basic tracking)
- A/B testing framework
- Multi-region deployment
- Advanced security features (MFA, etc.)
- Advanced CI/CD pipelines
- Kubernetes deployment (if not using)
- Real SSL/TLS certificates (self-signed in POC-3, real certificates in MVP)
- Enhanced session sync features (error handling, retry logic, device management UI - MVP)
- Hardened session sync features (security, rate limiting, compliance - Production)

---

## 12. Risks & Mitigations

| Risk                              | Impact | Mitigation                                              |
| --------------------------------- | ------ | ------------------------------------------------------- |
| nginx configuration complexity    | Medium | Start with basic config, iterate, test thoroughly       |
| WebSocket connection management   | Medium | Implement robust reconnection logic, test edge cases    |
| GraphQL complexity                | Medium | Start with simple queries, iterate, document thoroughly |
| Service Worker cache invalidation | Medium | Implement versioning, test cache strategies             |
| Performance optimization overhead | Low    | Measure before/after, optimize incrementally            |

---

## 13. Dependencies

**New Dependencies:**

- nginx (infrastructure)
- @apollo/client or urql (if GraphQL implemented)
- workbox (Service Worker)
- @sentry/react (monitoring)
- web-vitals (performance metrics)

**Backend Dependencies:**

- WebSocket server (if WebSocket implemented)
- GraphQL server (if GraphQL implemented)
- Event hub (RabbitMQ) - See `docs/backend-event-hub-implementation-plan.md`

---

## 14. Migration from POC-2

### 12.1 nginx Setup

**Step 1: Install nginx**

```bash
# Docker Compose or server installation
```

**Step 2: Configure nginx**

- Create nginx configuration files
- Setup reverse proxy
- Configure SSL/TLS with self-signed certificates
- Setup load balancing
- Note: Real certificates will be implemented in MVP

**Step 3: Update Deployment**

- Update deployment scripts
- Update environment variables
- Test nginx configuration

---

### 12.2 WebSocket Integration

**Step 1: Create WebSocket Client**

- Create `shared-websocket` library
- Implement connection management
- Integrate with event bus

**Step 2: Update MFEs**

- Add WebSocket to Payments MFE
- Add WebSocket to Admin MFE
- Replace polling with WebSocket

---

### 12.3 Performance Optimizations

**Step 1: Code Splitting**

- Implement route-based splitting
- Implement component-based splitting
- Test bundle sizes

**Step 2: Service Worker**

- Setup Workbox
- Configure caching strategies
- Test offline support

---

## 15. Testing Strategy

**Reference:** See `docs/testing-strategy-poc-phases.md` for comprehensive testing strategy.

### 15.1 Testing Goals

- ✅ Test nginx configuration
- ✅ Test WebSocket integration
- ✅ Test GraphQL (if implemented)
- ✅ Test caching strategies
- ✅ Test performance optimizations
- ✅ Test session management
- ✅ Test enhanced observability
- ✅ Test event hub (backend)

### 15.2 Unit Testing

**Tools:** Vitest 2.0.x, React Testing Library 16.1.x

**Scope:**

- All components (maintained from POC-2)
- WebSocket client library
- GraphQL client (if implemented)
- Session management utilities
- Caching utilities
- Performance utilities

**Coverage Target:** 80%

**Example:**

```typescript
// libs/shared-websocket/src/WebSocketClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import { WebSocketClient } from './WebSocketClient';

describe('WebSocketClient', () => {
  it('should connect to WebSocket', async () => {
    const client = new WebSocketClient('ws://localhost:8080');
    const connectSpy = vi.spyOn(client, 'connect');

    await client.connect();
    expect(connectSpy).toHaveBeenCalled();
  });
});
```

### 15.3 Integration Testing

**Tools:** Vitest, MSW

**Scope:**

- WebSocket real-time updates
- GraphQL queries and mutations (if implemented)
- Session synchronization (cross-tab)
- Caching strategies (Service Worker, browser cache)
- Performance optimizations (code splitting, lazy loading)
- Event hub integration (backend events → frontend updates)

**Example:**

```typescript
// apps/payments-mfe/src/integration/websocket-updates.test.tsx
describe('WebSocket Updates Integration', () => {
  it('should update payments list on WebSocket message', async () => {
    render(<PaymentsPage />);

    // Simulate WebSocket message
    wsClient.handleMessage({
      type: 'payment:updated',
      data: { id: '1', amount: 100, status: 'completed' },
    });

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });
});
```

### 15.4 E2E Testing

**Tools:** Playwright

**Scope:**

- Complete flows with nginx
- WebSocket real-time updates
- GraphQL queries (if implemented)
- Session synchronization
- Caching behavior
- Performance metrics
- Error handling with Sentry integration

**Example:**

```typescript
// e2e/websocket-realtime.spec.ts
test('should receive real-time payment updates', async ({ page }) => {
  await page.goto('http://localhost:4200');
  // ... sign in ...

  // Wait for WebSocket connection
  await page.waitForFunction(() => {
    return window.WebSocket && window.WebSocket.readyState === WebSocket.OPEN;
  });

  // Verify UI updated
  await expect(page.locator('text=$100.00')).toBeVisible();
});
```

### 15.5 Performance Testing

**Scope:**

- Load time metrics
- Bundle size validation
- Code splitting verification
- Lazy loading verification
- Core Web Vitals

**Example:**

```typescript
// e2e/performance.spec.ts
test('should load shell app quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  // Should load in under 2 seconds
  expect(loadTime).toBeLessThan(2000);
});
```

### 15.6 Testing Deliverables

- ✅ Unit tests for all components (80% coverage)
- ✅ Integration tests for WebSocket, GraphQL, session sync
- ✅ Integration tests for caching and performance
- ✅ E2E tests for all critical flows with infrastructure
- ✅ Performance testing
- ✅ Test coverage report (80% target)
- ✅ CI/CD test integration
- ✅ Test documentation

---

## 16. Next Steps

1. **Review and Approve:** Review this document and approve the approach
2. **Infrastructure Setup:** Ensure infrastructure is ready (nginx, SSL certificates)
3. **Backend Support:** Ensure backend supports WebSocket/GraphQL (if implementing)
4. **Kickoff:** Start Phase 1 (Infrastructure & nginx)
5. **Iterate:** Follow the implementation plan, adjusting as needed
6. **Document:** Document learnings and decisions as we go
7. **Deliver:** Complete POC-3 and prepare for MVP

**Related Documents:**

- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy for all POC phases
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)
- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc1-architecture.md` - POC-1 authentication & payments
- `docs/mfe-poc2-architecture.md` - POC-2 backend integration, design system & basic observability
- `docs/backend-architecture.md` - Backend architecture
- `docs/session-management-strategy.md` - Session management details
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing strategy

---

**Last Updated:** 2026-01-XX  
**Status:** Planning (Provisional) - Ready for Refinement
