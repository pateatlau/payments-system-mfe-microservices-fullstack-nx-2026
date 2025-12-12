import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import './styles.css';
import { initSentry, SentryErrorBoundary } from '@mfe-poc/shared-observability';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'auth-mfe',
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <SentryErrorBoundary showDialog={false}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
);
