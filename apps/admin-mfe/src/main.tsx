/**
 * Admin MFE Entry Point
 */

import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';

// Import global styles (Tailwind CSS v4)
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
