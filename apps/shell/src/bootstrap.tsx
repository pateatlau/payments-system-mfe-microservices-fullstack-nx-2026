import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import './styles.css';
import { registerServiceWorker } from './utils/register-sw';

// Import remote components
// This file (bootstrap.tsx) is dynamically imported, providing the async boundary
// required for Module Federation shared dependencies to initialize properly
import {
  SignInRemote,
  SignUpRemote,
  PaymentsPageRemote,
  AdminDashboardRemote,
} from './remotes';

// Create a QueryClient for TanStack Query
// This is needed for remote components that use TanStack Query (like PaymentsPage)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * AppWrapper Component
 * Wraps the app with WebSocketProvider that needs access to auth state
 */
function AppWrapper() {
  // Get auth token for WebSocket authentication
  const accessToken = useAuthStore(state => state.accessToken);

  // WebSocket URL
  // Development: Direct to API Gateway (ws://localhost:3000/ws)
  // Production: Through nginx proxy (wss://localhost/ws)
  const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';

  return (
    <WebSocketProvider
      url={wsUrl}
      token={accessToken || undefined}
      debug={process.env['NODE_ENV'] === 'development'}
    >
      <BrowserRouter>
        <App
          remotes={{
            SignInComponent: SignInRemote,
            SignUpComponent: SignUpRemote,
            PaymentsComponent: PaymentsPageRemote,
            AdminDashboardComponent: AdminDashboardRemote,
          }}
        />
      </BrowserRouter>
    </WebSocketProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWrapper />
    </QueryClientProvider>
  </StrictMode>
);

// Register service worker for offline support and caching (production only)
registerServiceWorker();
