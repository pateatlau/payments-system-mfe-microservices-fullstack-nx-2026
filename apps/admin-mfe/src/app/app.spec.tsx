/**
 * App Component Tests
 */

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import App from './app';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock WebSocket for tests
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 0,
})) as unknown as typeof WebSocket;

describe('App', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    // Mock user data
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
      isAuthenticated: true,
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <WebSocketProvider url="ws://localhost:3000/ws" autoConnect={false}>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </WebSocketProvider>
    );
  };

  it('should render successfully', () => {
    const { baseElement } = renderWithProviders(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should display admin dashboard', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
