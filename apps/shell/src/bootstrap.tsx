import { StrictMode, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import { useThemeStore } from '@mfe/shared-theme-store';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import './styles.css';
import { registerServiceWorker } from './utils/register-sw';
import {
  initSentry,
  SentryErrorBoundary,
  setUser,
  clearUser,
  setTag,
} from '@mfe-poc/shared-observability';

// Import remote components
// This file (bootstrap.tsx) is dynamically imported, providing the async boundary
// required for Module Federation shared dependencies to initialize properly
import {
  SignInRemote,
  SignUpRemote,
  PaymentsPageRemote,
  AdminDashboardRemote,
  ProfilePageRemote,
} from './remotes';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'shell',
});

// Set app-level tags for filtering in Sentry dashboard
setTag('app', 'shell');
setTag('version', process.env['NX_APP_VERSION'] || '0.0.1');

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
  // Get auth token and user info for WebSocket authentication and Sentry
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);

  // WebSocket URL
  // Development & Production: Through nginx proxy (wss://localhost/ws)
  // Direct API Gateway access (ws://localhost:3000/ws) available via env var
  const wsUrl = process.env['NX_WS_URL'] || 'wss://localhost/ws';

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
    >
      <BrowserRouter>
        <App
          remotes={{
            SignInComponent: SignInRemote,
            SignUpComponent: SignUpRemote,
            PaymentsComponent: PaymentsPageRemote,
            AdminDashboardComponent: AdminDashboardRemote,
            ProfilePageComponent: ProfilePageRemote,
          }}
        />
      </BrowserRouter>
    </WebSocketProvider>
  );
}

async function bootstrap() {
  // Initialize theme before React renders to avoid flash of wrong theme
  try {
    await useThemeStore.getState().initializeTheme();
  } catch (error) {
    console.warn(
      'Theme initialization failed, continuing with defaults.',
      error
    );
  }

  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <StrictMode>
      <SentryErrorBoundary
        fallback={() => (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#084683',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
        showDialog={false}
      >
        <QueryClientProvider client={queryClient}>
          <AppWrapper />
        </QueryClientProvider>
      </SentryErrorBoundary>
    </StrictMode>
  );

  // Register service worker for offline support and caching (production only)
  registerServiceWorker();
}

bootstrap();
