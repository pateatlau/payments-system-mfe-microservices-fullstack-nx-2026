/**
 * Test utilities for admin-mfe
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from 'shared-websocket';

// Mock WebSocket for tests
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 0,
  })) as unknown as typeof WebSocket;
}

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * All providers wrapper for tests
 */
export function AllProviders({
  children,
  queryClient = createTestQueryClient(),
}: AllProvidersProps) {
  return (
    <WebSocketProvider url="ws://localhost:3000/ws" autoConnect={false}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WebSocketProvider>
  );
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
