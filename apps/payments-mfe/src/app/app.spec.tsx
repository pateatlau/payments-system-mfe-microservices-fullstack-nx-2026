import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import App from './app';
import { useAuthStore } from 'shared-auth-store';
import { usePayments } from '../hooks';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the hooks
jest.mock('../hooks', () => ({
  usePayments: jest.fn(),
  useCreatePayment: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useUpdatePayment: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useDeletePayment: jest.fn(() => ({
    mutateAsync: jest.fn(),
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
    jest.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('should render successfully', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'CUSTOMER',
      },
      hasRole: jest.fn(() => false),
    });

    (usePayments as ReturnType<typeof jest.fn>).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { baseElement } = render(<App />, { wrapper: createWrapper() });
    expect(baseElement).toBeTruthy();
  });

  it('should render PaymentsPage', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'CUSTOMER',
      },
      hasRole: jest.fn(() => false),
    });

    (usePayments as ReturnType<typeof jest.fn>).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<App />, { wrapper: createWrapper() });
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });
});
