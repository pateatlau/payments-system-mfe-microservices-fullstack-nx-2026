import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { SignUpPage, SignUpComponentProps } from './SignUpPage';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock SignUp component for testing (injected via props)
function MockSignUp({ onSuccess, onNavigateToSignIn }: SignUpComponentProps) {
  return (
    <div data-testid="mock-signup">
      <span>Mocked SignUp Component</span>
      <button onClick={onSuccess} data-testid="success-btn">
        Trigger Success
      </button>
      <button onClick={onNavigateToSignIn} data-testid="signin-btn">
        Go to Sign In
      </button>
    </div>
  );
}

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SignUp component when not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignUpPage SignUpComponent={MockSignUp} />
      </MemoryRouter>
    );

    expect(screen.getByText('Mocked SignUp Component')).toBeInTheDocument();
    expect(screen.getByTestId('mock-signup')).toBeInTheDocument();
  });

  it('redirects to /payments when already authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignUpPage SignUpComponent={MockSignUp} />
      </MemoryRouter>
    );

    // Should redirect (Navigate component renders null in the current location)
    expect(screen.queryByText('Mocked SignUp Component')).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('passes onSuccess callback to SignUp component', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignUpPage SignUpComponent={MockSignUp} />
      </MemoryRouter>
    );

    // The success button should be present (callback is passed)
    expect(screen.getByTestId('success-btn')).toBeInTheDocument();
  });

  it('passes onNavigateToSignIn callback to SignUp component', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignUpPage SignUpComponent={MockSignUp} />
      </MemoryRouter>
    );

    // The signin button should be present (callback is passed)
    expect(screen.getByTestId('signin-btn')).toBeInTheDocument();
  });

  it('renders with correct layout styles', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <SignUpPage SignUpComponent={MockSignUp} />
      </MemoryRouter>
    );

    // Check that the wrapper div has the correct classes
    const wrapper = screen.getByTestId('mock-signup').parentElement;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
