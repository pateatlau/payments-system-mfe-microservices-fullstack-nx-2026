import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsPage } from './PaymentsPage';
import type {
  ReactNode,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';

// Mock shared-auth-store to return a CUSTOMER user
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'cust-1', role: 'CUSTOMER' },
    hasRole: (role: string) => role === 'CUSTOMER',
  }),
}));

vi.mock('@mfe/shared-design-system', () => ({
  Button: ({
    children,
    onClick,
    type = 'button',
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
  }) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
  Input: ({
    id,
    type,
    ...props
  }: {
    id?: string;
    type?: string;
  } & InputHTMLAttributes<HTMLInputElement>) => (
    <input id={id} type={type} {...props} />
  ),
  Label: ({
    children,
    htmlFor,
  }: {
    children: ReactNode;
    htmlFor?: string;
  } & LabelHTMLAttributes<HTMLLabelElement>) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Alert: ({ children }: { children: ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  AlertTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Loading: ({ label }: { label: string }) => <div>{label}</div>,
}));

describe('PaymentsPage - Customer Create Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Create Payment button for customers and opens form', async () => {
    const user = userEvent.setup();
    render(<PaymentsPage />);

    const btn = screen.getByText(/Create Payment/i);
    expect(btn).toBeInTheDocument();

    await user.click(btn);

    // Type label should be present
    expect(screen.getByLabelText(/Payment Type/i)).toBeInTheDocument();

    // Ensure the type select defaults to Instant
    const typeSelect = screen.getByLabelText(
      /Payment Type/i
    ) as HTMLSelectElement;
    expect(typeSelect.value).toBe('instant');
  });
});
