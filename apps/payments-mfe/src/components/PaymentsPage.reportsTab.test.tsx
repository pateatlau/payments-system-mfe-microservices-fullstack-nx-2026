import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Payment } from '../api/types';
import { PaymentStatus, PaymentType } from 'shared-types';
import { PaymentsPage } from './PaymentsPage';
import * as paymentsApi from '../api/payments';

// Dynamic role for auth mock
let mockRole: 'VENDOR' | 'CUSTOMER' = 'VENDOR';

// Mock shared-auth-store with dynamic role
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'user-123', role: mockRole },
    hasRole: (role: string) => role === mockRole,
  })),
}));

// Mock payments API
jest.mock('../api/payments');

// Mock PaymentFilters (simplify rendering)
jest.mock('./PaymentFilters', () => ({
  PaymentFilters: () => <div data-testid="payment-filters">Filters</div>,
}));

// Mock PaymentReports (just a marker)
jest.mock('./PaymentReports', () => ({
  PaymentReports: () => (
    <div data-testid="payment-reports">Reports Content</div>
  ),
}));

// Mock usePaymentUpdates
jest.mock('../hooks/usePaymentUpdates', () => ({
  usePaymentUpdates: () => ({}),
}));

// Shared utilities
const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    userId: 'user-123',
    amount: 100,
    currency: 'USD',
    description: 'Test 1',
    status: PaymentStatus.COMPLETED,
    type: PaymentType.INSTANT,
    metadata: {},
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
  },
];

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  (paymentsApi.listPayments as jest.Mock).mockResolvedValue(mockPayments);
  // reset role to vendor by default
  mockRole = 'VENDOR';
});

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <PaymentsPage />
    </QueryClientProvider>
  );
}

describe('PaymentsPage - Reports Tab Integration', () => {
  it('shows Reports tab for vendors and switches content on click', async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for payments to load (filters visible)
    expect(await screen.findByTestId('payment-filters')).toBeInTheDocument();

    // Vendor sees Reports tab
    const reportsTab = screen.getByRole('button', { name: /reports/i });
    expect(reportsTab).toBeInTheDocument();
    expect(screen.queryByTestId('payment-reports')).not.toBeInTheDocument();

    // Switch to reports
    await user.click(reportsTab);
    expect(screen.getByTestId('payment-reports')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-filters')).not.toBeInTheDocument();
  });

  it('hides Reports tab for customers', async () => {
    userEvent.setup();
    mockRole = 'CUSTOMER';
    renderPage();

    // Wait for payments to load
    expect(await screen.findByTestId('payment-filters')).toBeInTheDocument();

    // Customer should not see Reports tab
    expect(
      screen.queryByRole('button', { name: /reports/i })
    ).not.toBeInTheDocument();
  });
});
