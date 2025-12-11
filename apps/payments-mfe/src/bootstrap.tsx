import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import App from './app/app';
import { QueryProvider } from './providers/QueryProvider';
import './styles.css';

/**
 * AppWrapper - provides WebSocket context for standalone mode
 */
function AppWrapper() {
  const accessToken = useAuthStore(state => state.accessToken);
  const wsUrl = process.env['NX_WS_URL'] || 'ws://localhost:3000/ws';

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
    <AppWrapper />
  </StrictMode>
);
