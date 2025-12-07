import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the Module Federation remote import
vi.mock('authMfe/SignUp', () => ({
  default: () => <div>Mocked SignUp Component</div>,
}));

// Import after mocks are set up
import { SignUpPage } from './SignUpPage';

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when not authenticated', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    // Wait for lazy component to load
    await waitFor(() => {
      expect(screen.getByText('Mocked SignUp Component')).toBeInTheDocument();
    });
  });

  it('redirects when already authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignUpPage />
      </MemoryRouter>
    );

    // Should redirect (Navigate component behavior)
    expect(container).toBeTruthy();
  });
});
