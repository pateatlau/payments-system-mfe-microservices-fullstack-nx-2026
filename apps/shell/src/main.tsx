import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import './styles.css';

// Import remote components
// This file (main.tsx) is not imported during tests, so MF imports are safe here
import {
  SignInRemote,
  SignUpRemote,
  PaymentsPageRemote,
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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App
          remotes={{
            SignInComponent: SignInRemote,
            SignUpComponent: SignUpRemote,
            PaymentsComponent: PaymentsPageRemote,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
