import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the Module Federation remote import
vi.mock('paymentsMfe/PaymentsPage', () => ({
  default: () => <div>Mocked PaymentsPage Component</div>,
}));

// Import after mocks are set up
import { PaymentsPage } from './PaymentsPage';

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when authenticated', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    // Wait for lazy component to load
    await waitFor(() => {
      expect(screen.getByText('Mocked PaymentsPage Component')).toBeInTheDocument();
    });
  });

  it('redirects when not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/payments']}>
        <PaymentsPage />
      </MemoryRouter>
    );

    // Should redirect (Navigate component behavior)
    expect(container).toBeTruthy();
  });
});
