import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import './styles.css';
import {
  initSentry,
  SentryErrorBoundary,
  setTag,
} from '@mfe-poc/shared-observability';

// Initialize Sentry (must be done before rendering)
initSentry({
  appName: 'auth-mfe',
});

// Set app-level tags for filtering in Sentry dashboard
setTag('app', 'auth-mfe');
setTag('version', process.env['NX_APP_VERSION'] || '0.0.1');

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
