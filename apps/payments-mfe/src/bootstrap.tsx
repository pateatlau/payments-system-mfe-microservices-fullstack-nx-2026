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
  setTag,
} from '@mfe-poc/shared-observability';
import {
  GraphQLProvider,
  createGraphQLClient,
} from '@payments-system/shared-graphql-client';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'payments-mfe',
});

// Set app-level tags for filtering in Sentry dashboard
setTag('app', 'payments-mfe');
setTag('version', process.env['NX_APP_VERSION'] || '0.0.1');

/**
 * AppWrapper - provides WebSocket and GraphQL context for standalone mode
 */
function AppWrapper() {
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';
  const graphqlUrl =
    process.env['NX_GRAPHQL_URL'] || 'http://localhost:3000/graphql';

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

  // Create GraphQL client
  const graphqlClient = createGraphQLClient({
    uri: graphqlUrl,
    getAccessToken: () => accessToken,
    onError: error => {
      // eslint-disable-next-line no-console
      console.error('GraphQL error:', error);
    },
  });

  return (
    <GraphQLProvider client={graphqlClient}>
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
    </GraphQLProvider>
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
