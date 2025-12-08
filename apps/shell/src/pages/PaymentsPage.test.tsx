import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentsPage, PaymentsComponentProps } from './PaymentsPage';

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
    jest.clearAllMocks();
  });

  it('renders PaymentsPage component when component is injected', () => {
    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Mocked PaymentsPage Component')
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
  });

  it('renders without Suspense wrapper when component is injected', () => {
    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    // Should not show loading fallback when component is injected
    expect(screen.queryByText('Loading payments...')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
  });

  it('renders injected component directly without wrapper', () => {
    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={MockPaymentsPage} />
      </MemoryRouter>
    );

    // PaymentsPage renders the injected component directly
    const mockPayments = screen.getByTestId('mock-payments');
    expect(mockPayments).toBeInTheDocument();
  });

  it('accepts optional PaymentsComponent prop', () => {
    // This test verifies the component works with DI pattern
    const CustomMockPayments = () => (
      <div data-testid="custom-payments">Custom Payments</div>
    );

    render(
      <MemoryRouter>
        <PaymentsPage PaymentsComponent={CustomMockPayments} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('custom-payments')).toBeInTheDocument();
    expect(screen.getByText('Custom Payments')).toBeInTheDocument();
  });
});
