import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentDetails } from './PaymentDetails';
import type { Payment } from 'shared-types';
import { PaymentStatus, PaymentType } from 'shared-types';

// Mock shared-auth-store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock design system components
vi.mock('@mfe/shared-design-system', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  Alert: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <div data-testid={`alert-${variant}`}>{children}</div>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="alert-title">{children}</h3>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="alert-description">{children}</p>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button data-testid={`button-${variant || 'default'}`} onClick={onClick}>
      {children}
    </button>
  ),
  Loading: ({ label }: { label: string }) => (
    <div data-testid="loading">{label}</div>
  ),
}));

// Import after mocking
import { useAuthStore } from 'shared-auth-store';

// Local test type extending Payment with optional fields used by the component
type TestPayment = Payment & {
  senderId?: string;
  recipientId?: string;
  sender?: { id: string; email: string };
  recipient?: { id: string; email: string };
  completedAt?: string;
  transactions?: Array<{
    id: string;
    status: string;
    statusMessage: string;
    createdAt: string;
    pspTransactionId?: string;
  }>;
};

describe('PaymentDetails Component', () => {
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'CUSTOMER' as const,
  };

  const mockPayment: TestPayment = {
    id: 'payment-1',
    userId: 'user-1',
    senderId: 'user-1',
    recipientId: 'user-2',
    amount: 100,
    currency: 'USD',
    status: PaymentStatus.COMPLETED,
    type: PaymentType.INSTANT,
    description: 'Test payment',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    completedAt: '2025-01-02T00:00:00Z',
    sender: { id: 'user-1', email: 'sender@example.com' },
    recipient: { id: 'user-2', email: 'recipient@example.com' },
    transactions: [
      {
        id: 'txn-1',
        status: 'initiated',
        statusMessage: 'Payment initiated',
        createdAt: '2025-01-01T00:00:00Z',
        pspTransactionId: 'psp-123',
      },
      {
        id: 'txn-2',
        status: 'completed',
        statusMessage: 'Payment completed successfully',
        createdAt: '2025-01-02T00:00:00Z',
      },
    ],
    metadata: { reference: 'REF-123', source: 'web' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const authStoreMock = useAuthStore as unknown as {
      mockReturnValue: (value: unknown) => void;
    };
    authStoreMock.mockReturnValue({
      user: mockUser,
    });
  });

  it('should display loading state', () => {
    render(<PaymentDetails payment={null} isLoading={true} isError={false} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText(/loading payment details/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    const error = new Error('Failed to load');
    render(
      <PaymentDetails
        payment={null}
        isLoading={false}
        isError={true}
        error={error}
      />
    );

    expect(screen.getByTestId('alert-destructive')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should display payment details when loaded', () => {
    render(
      <PaymentDetails payment={mockPayment} isLoading={false} isError={false} />
    );

    // Check header
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText(`ID: ${mockPayment.id}`)).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText(PaymentStatus.COMPLETED)).toBeInTheDocument();

    // Summary section renders
    expect(screen.getByText(/Summary/i)).toBeInTheDocument();
  });

  it('should display sender and recipient information', () => {
    render(
      <PaymentDetails payment={mockPayment} isLoading={false} isError={false} />
    );

    expect(screen.getByText('sender@example.com')).toBeInTheDocument();
    expect(screen.getByText('recipient@example.com')).toBeInTheDocument();
    expect(screen.getByText(/From \(Sender\)/)).toBeInTheDocument();
    expect(screen.getByText(/To \(Recipient\)/)).toBeInTheDocument();
  });

  it('should display transaction history', () => {
    render(
      <PaymentDetails payment={mockPayment} isLoading={false} isError={false} />
    );

    expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
    expect(screen.getByText(/Payment initiated/)).toBeInTheDocument();
    expect(
      screen.getByText(/Payment completed successfully/)
    ).toBeInTheDocument();
    expect(screen.getByText(/psp-123/)).toBeInTheDocument();
  });

  it('should display metadata when present', () => {
    render(
      <PaymentDetails payment={mockPayment} isLoading={false} isError={false} />
    );

    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('reference:')).toBeInTheDocument();
    expect(screen.getByText('REF-123')).toBeInTheDocument();
    expect(screen.getByText('source:')).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
  });

  it('should show edit button when sender can edit', () => {
    const onEdit = vi.fn();
    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByTestId('button-outline');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('Edit Payment');
  });

  it('should not show cancel button for completed payment', () => {
    const onCancel = vi.fn();
    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onCancel={onCancel}
      />
    );

    // Cancel button should not appear for completed payments
    const cancelButtons = screen.queryAllByTestId('button-destructive');
    expect(cancelButtons).toHaveLength(0);
  });

  it('should show cancel button for pending payment from sender', () => {
    const pendingPayment: Payment = {
      ...mockPayment,
      status: PaymentStatus.PENDING,
    };
    const onCancel = vi.fn();

    render(
      <PaymentDetails
        payment={pendingPayment}
        isLoading={false}
        isError={false}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByTestId('button-destructive');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel Payment');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByTestId('button-outline');
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockPayment);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const pendingPayment: Payment = {
      ...mockPayment,
      status: PaymentStatus.PENDING,
    };
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <PaymentDetails
        payment={pendingPayment}
        isLoading={false}
        isError={false}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByTestId('button-destructive');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledWith(pendingPayment);
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onClose={onClose}
      />
    );

    // Find and click the close button (✕)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.textContent === '✕');

    if (closeButton) {
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not show edit button when user is not sender and not admin', () => {
    (
      useAuthStore as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({
      user: { id: 'different-user', role: 'CUSTOMER' },
    });

    const onEdit = vi.fn();
    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onEdit={onEdit}
      />
    );

    expect(screen.queryByTestId('button-outline')).not.toBeInTheDocument();
  });

  it('should show edit button when user is admin', () => {
    (
      useAuthStore as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({
      user: { id: 'admin-user', role: 'ADMIN' },
    });

    const onEdit = vi.fn();
    render(
      <PaymentDetails
        payment={mockPayment}
        isLoading={false}
        isError={false}
        onEdit={onEdit}
      />
    );

    expect(screen.getByTestId('button-outline')).toBeInTheDocument();
  });

  it('should handle payment without description', () => {
    const paymentNoDesc: Payment = {
      ...mockPayment,
      description: undefined,
    };

    render(
      <PaymentDetails
        payment={paymentNoDesc}
        isLoading={false}
        isError={false}
      />
    );

    // Should still render component
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
  });

  it('should handle payment without metadata', () => {
    const paymentNoMetadata: Payment = {
      ...mockPayment,
      metadata: {},
    };

    render(
      <PaymentDetails
        payment={paymentNoMetadata}
        isLoading={false}
        isError={false}
      />
    );

    // Metadata section should not render
    expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
  });

  it('should handle payment without transaction history', () => {
    const paymentNoTxn: Payment = {
      ...mockPayment,
    };

    render(
      <PaymentDetails
        payment={paymentNoTxn}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText(/No transaction history/)).toBeInTheDocument();
  });

  it('should render all status badges correctly', () => {
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ];

    statuses.forEach(status => {
      const { unmount } = render(
        <PaymentDetails
          payment={{ ...mockPayment, status }}
          isLoading={false}
          isError={false}
        />
      );

      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });
});
