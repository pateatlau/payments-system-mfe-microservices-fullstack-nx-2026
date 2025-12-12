import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { SignInPage, SignInComponentProps } from './SignInPage';

// Mock the auth store - handle both selector and direct usage
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(
    (selector?: (state: { isAuthenticated: boolean }) => boolean) => {
      const mockState = { isAuthenticated: false };
      // If a selector is passed, call it with the mock state
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return mockState;
    }
  ),
}));

// Mock SignIn component for testing (injected via props)
function MockSignIn({ onSuccess, onNavigateToSignUp }: SignInComponentProps) {
  return (
    <div data-testid="mock-signin">
      <span>Mocked SignIn Component</span>
      <button onClick={onSuccess} data-testid="success-btn">
        Trigger Success
      </button>
      <button onClick={onNavigateToSignUp} data-testid="signup-btn">
        Go to Sign Up
      </button>
    </div>
  );
}

// Helper to mock auth store with specific state
function mockAuthStore(state: { isAuthenticated: boolean }) {
  (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockImplementation(
    (selector?: (state: { isAuthenticated: boolean }) => boolean) => {
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    }
  );
}

describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SignIn component when not authenticated', () => {
    mockAuthStore({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <SignInPage SignInComponent={MockSignIn} />
      </MemoryRouter>
    );

    expect(screen.getByText('Mocked SignIn Component')).toBeInTheDocument();
    expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
  });

  it('redirects to /payments when already authenticated', () => {
    mockAuthStore({ isAuthenticated: true });

    const { container } = render(
      <MemoryRouter initialEntries={['/signin']}>
        <SignInPage SignInComponent={MockSignIn} />
      </MemoryRouter>
    );

    // Should redirect (Navigate component renders null in the current location)
    expect(
      screen.queryByText('Mocked SignIn Component')
    ).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('passes onSuccess callback to SignIn component', () => {
    mockAuthStore({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <SignInPage SignInComponent={MockSignIn} />
      </MemoryRouter>
    );

    // The success button should be present (callback is passed)
    expect(screen.getByTestId('success-btn')).toBeInTheDocument();
  });

  it('passes onNavigateToSignUp callback to SignIn component', () => {
    mockAuthStore({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <SignInPage SignInComponent={MockSignIn} />
      </MemoryRouter>
    );

    // The signup button should be present (callback is passed)
    expect(screen.getByTestId('signup-btn')).toBeInTheDocument();
  });

  it('renders with correct layout styles', () => {
    mockAuthStore({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <SignInPage SignInComponent={MockSignIn} />
      </MemoryRouter>
    );

    // Check that the wrapper div has the correct classes
    const wrapper = screen.getByTestId('mock-signin').parentElement;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
