/**
 * Admin MFE Entry Point
 */

import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';

import App from './app/app';

// Import global styles (Tailwind CSS v4)
import './styles.css';
import {
  initSentry,
  SentryErrorBoundary,
  setUser,
  clearUser,
} from '@mfe-poc/shared-observability';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'admin-mfe',
});

// Create QueryClient for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * AppWrapper - provides WebSocket context for standalone mode
 */
function AppWrapper() {
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';

  // Set user context in Sentry when user is available
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      clearUser();
    }
  }, [user]);

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <SentryErrorBoundary showDialog={false}>
      <AppWrapper />
    </SentryErrorBoundary>
  </StrictMode>
);
