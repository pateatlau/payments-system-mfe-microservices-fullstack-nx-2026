import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentReports } from './PaymentReports';

// Mock shared-auth-store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'vendor-1', role: 'VENDOR' },
  }),
}));

// Mock design system
vi.mock('@mfe/shared-design-system', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Loading: ({ label }: { label: string }) => (
    <div data-testid="loading">{label}</div>
  ),
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  AlertTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

// Mock hook
vi.mock('../hooks', async importOriginal => {
  const orig = await importOriginal<typeof import('../hooks')>();
  return {
    ...orig,
    usePaymentReports: vi.fn(),
  };
});

import { usePaymentReports } from '../hooks';

describe('PaymentReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    (
      usePaymentReports as unknown as { mockReturnValue: (v: unknown) => void }
    ).mockReturnValue({
      isLoading: true,
    });

    render(<PaymentReports />);

    expect(screen.getByTestId('loading')).toHaveTextContent(
      /Loading payment reports/i
    );
  });

  it('shows error state', () => {
    (
      usePaymentReports as unknown as { mockReturnValue: (v: unknown) => void }
    ).mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('Failed to load reports'),
    });

    render(<PaymentReports />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load reports/i)).toBeInTheDocument();
  });

  it('renders summary and charts on success', () => {
    (
      usePaymentReports as unknown as { mockReturnValue: (v: unknown) => void }
    ).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        totalPayments: 10,
        totalAmount: 2500,
        byStatus: { completed: 7, pending: 2, failed: 1 },
        byType: { instant: 6, scheduled: 3, recurring: 1 },
        period: { start: '2025-12-01', end: '2025-12-21' },
      },
      refetch: vi.fn(),
    });

    render(<PaymentReports />);

    expect(screen.getByLabelText(/Total payments/i)).toHaveTextContent('10');
    expect(screen.getByLabelText(/Total amount/i)).toHaveTextContent('2,500');
    expect(screen.getByLabelText(/Success rate/i)).toHaveTextContent('70%');
    expect(screen.getByLabelText(/Average amount/i)).toHaveTextContent(
      '250.00'
    );

    // Status chart labels present
    expect(screen.getByText(/By Status/i)).toBeInTheDocument();
    expect(screen.getByText(/By Type/i)).toBeInTheDocument();
  });

  it('date inputs update values and Apply triggers refetch', () => {
    const refetch = vi.fn();
    (
      usePaymentReports as unknown as { mockReturnValue: (v: unknown) => void }
    ).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        totalPayments: 0,
        totalAmount: 0,
        byStatus: {},
        byType: {},
        period: { start: '', end: '' },
      },
      refetch,
    });

    render(<PaymentReports />);

    const start = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    const end = screen.getByLabelText(/End date/i) as HTMLInputElement;

    fireEvent.change(start, { target: { value: '2025-12-01' } });
    fireEvent.change(end, { target: { value: '2025-12-21' } });

    expect(start.value).toBe('2025-12-01');
    expect(end.value).toBe('2025-12-21');

    fireEvent.click(screen.getByText(/Apply/i));
    expect(refetch).toHaveBeenCalled();
  });
});
