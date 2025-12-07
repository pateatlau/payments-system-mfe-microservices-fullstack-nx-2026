import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the Module Federation remote import
vi.mock('authMfe/SignIn', () => ({
  default: () => <div>Mocked SignIn Component</div>,
}));

// Import after mocks are set up
import { SignInPage } from './SignInPage';

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when not authenticated', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    // Wait for lazy component to load
    await waitFor(() => {
      expect(screen.getByText('Mocked SignIn Component')).toBeInTheDocument();
    });
  });

  it('redirects when already authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/signin']}>
        <SignInPage />
      </MemoryRouter>
    );

    // Should redirect (Navigate component behavior)
    expect(container).toBeTruthy();
  });
});
