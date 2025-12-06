import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import App from './app';
import { useAuthStore } from 'shared-auth-store';
import { usePayments } from '../hooks';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the hooks
vi.mock('../hooks', () => ({
  usePayments: vi.fn(),
  useCreatePayment: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useUpdatePayment: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useDeletePayment: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

describe('App', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('should render successfully', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
      hasRole: vi.fn(() => false),
    });

    (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { baseElement } = render(<App />, { wrapper: createWrapper() });
    expect(baseElement).toBeTruthy();
  });

  it('should render PaymentsPage', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
      hasRole: vi.fn(() => false),
    });

    (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<App />, { wrapper: createWrapper() });
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });
});
