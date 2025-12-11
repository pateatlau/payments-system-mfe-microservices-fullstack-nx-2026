import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import App from './app/app';
import { QueryProvider } from './providers/QueryProvider';
import './styles.css';
import {
  initSentry,
  SentryErrorBoundary,
  setUser,
  clearUser,
} from '@mfe-poc/shared-observability';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'payments-mfe',
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
      <QueryProvider>
        <App />
      </QueryProvider>
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
