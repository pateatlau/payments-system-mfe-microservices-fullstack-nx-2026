import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
// CSS import temporarily commented out - will be enabled in Phase 4 (PostCSS/Tailwind configuration)
// import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
