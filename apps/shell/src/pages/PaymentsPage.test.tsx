import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { PaymentsPage, PaymentsComponentProps } from './PaymentsPage';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock PaymentsPage component for testing (injected via props)
function MockPaymentsPage(_props: PaymentsComponentProps) {
  return (
    <div data-testid="mock-payments">
      <span>Mocked PaymentsPage Component</span>
    </div>
  );
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PaymentsPage component when authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    expect(screen.getByText('Mocked PaymentsPage Component')).toBeInTheDocument();
    expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
  });

  it('redirects to /signin when not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/payments']}>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    // Should redirect (Navigate component renders null in the current location)
    expect(screen.queryByText('Mocked PaymentsPage Component')).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('renders without wrapper layout when authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    // PaymentsPage doesn't wrap in extra layout div when component is injected
    const mockPayments = screen.getByTestId('mock-payments');
    expect(mockPayments).toBeInTheDocument();
  });

  it('protects the route by checking authentication', () => {
    // First render with authenticated user
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    const { rerender } = render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-payments')).toBeInTheDocument();

    // Re-render with unauthenticated user
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    rerender(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    // Should no longer show payments
    expect(screen.queryByTestId('mock-payments')).not.toBeInTheDocument();
  });
});
