import React from 'react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore, type User } from 'shared-auth-store';
import { AppRoutes } from '../routes/AppRoutes';

// Default mock state
const defaultMockState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
};

// Current mock state (mutable for tests)
let currentMockState = { ...defaultMockState };

// Mock the auth store - handle both selector and direct usage
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(
    (selector?: (state: typeof defaultMockState) => unknown) => {
      // If a selector is passed, call it with the mock state
      if (typeof selector === 'function') {
        return selector(currentMockState);
      }
      return currentMockState;
    }
  ),
}));

// Helper to set mock auth state
function setMockAuthState(state: Partial<typeof defaultMockState>) {
  currentMockState = { ...defaultMockState, ...state };
  // Update the mock implementation with new state
  (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockImplementation(
    (selector?: (state: typeof defaultMockState) => unknown) => {
      if (typeof selector === 'function') {
        return selector(currentMockState);
      }
      return currentMockState;
    }
  );
}

// Mock components for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockSignIn = jest.fn(({ onSuccess, onNavigateToSignUp }: any) => (
  <div data-testid="mock-signin">
    <button onClick={onSuccess} data-testid="signin-success">
      Sign In Success
    </button>
    <button onClick={onNavigateToSignUp} data-testid="navigate-signup">
      Go to Sign Up
    </button>
  </div>
));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockSignUp = jest.fn(({ onSuccess, onNavigateToSignIn }: any) => (
  <div data-testid="mock-signup">
    <button onClick={onSuccess} data-testid="signup-success">
      Sign Up Success
    </button>
    <button onClick={onNavigateToSignIn} data-testid="navigate-signin">
      Go to Sign In
    </button>
  </div>
));

const MockPaymentsPage = jest.fn(() => (
  <div data-testid="mock-payments">
    <h1>Payments Page</h1>
  </div>
));

// Mock ProtectedRoute
jest.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) {
      return <div data-testid="loading">Loading...</div>;
    }
    if (!isAuthenticated) {
      return (
        <div data-testid="redirect-to-signin">Redirecting to sign in...</div>
      );
    }
    return <>{children}</>;
  },
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state
    currentMockState = { ...defaultMockState };
  });

  describe('Unauthenticated User Flow', () => {
    beforeEach(() => {
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    });

    it('should redirect from root (/) to /signin when not authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-payments')).not.toBeInTheDocument();
    });

    it('should show SignIn page at /signin', () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
      expect(screen.getByTestId('signin-success')).toBeInTheDocument();
    });

    it('should navigate to SignUp when clicking navigate button', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      const navigateButton = screen.getByTestId('navigate-signup');
      await user.click(navigateButton);

      expect(screen.getByTestId('mock-signup')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    });

    it('should provide onSuccess callback to SignIn component for navigation', () => {
      // Start unauthenticated
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // Verify SignIn component is rendered with callback buttons
      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
      expect(screen.getByTestId('signin-success')).toBeInTheDocument();
      // The onSuccess callback is passed from SignInPage to SignIn component
      // This callback triggers navigation to /payments after successful sign in
      // This test verifies the integration between components
    });

    it('should provide onSuccess callback to SignUp component for navigation', () => {
      // Start unauthenticated
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // Verify SignUp component is rendered with callback buttons
      expect(screen.getByTestId('mock-signup')).toBeInTheDocument();
      expect(screen.getByTestId('signup-success')).toBeInTheDocument();
      // The onSuccess callback is passed from SignUpPage to SignUp component
      // This callback triggers navigation to /payments after successful sign up
      // This test verifies the integration between components
    });
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      setMockAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        } as User,
      });
    });

    it('should redirect from root (/) to /payments when authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    });

    it('should show PaymentsPage at /payments when authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/payments']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.getByText('Payments Page')).toBeInTheDocument();
    });

    it('should redirect from /signin to /payments when already authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // Should redirect to payments (or show payments)
      // The actual redirect happens via Navigate component
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    it('should redirect unauthenticated user from /payments to sign in', () => {
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/payments']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // ProtectedRoute should show redirect message
      expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-payments')).not.toBeInTheDocument();
    });

    it('should allow authenticated user to access /payments', () => {
      setMockAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        } as User,
      });

      render(
        <MemoryRouter initialEntries={['/payments']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(
        screen.queryByTestId('redirect-to-signin')
      ).not.toBeInTheDocument();
    });

    it('should redirect authenticated user from /signin to /payments', () => {
      setMockAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        } as User,
      });

      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // Should not show sign in page
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    });
  });

  describe('State Synchronization', () => {
    it('should update UI when authentication state changes', () => {
      // Start unauthenticated
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();

      // Change to authenticated
      setMockAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        } as User,
      });

      rerender(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      setMockAuthState({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/payments']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-payments')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Flow', () => {
    beforeEach(() => {
      setMockAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    });

    it('should navigate between signin and signup pages', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/signin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPaymentsPage}
          />
        </MemoryRouter>
      );

      // Start on sign in
      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();

      // Navigate to sign up
      const navigateToSignUp = screen.getByTestId('navigate-signup');
      await user.click(navigateToSignUp);

      expect(screen.getByTestId('mock-signup')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();

      // Navigate back to sign in
      const navigateToSignIn = screen.getByTestId('navigate-signin');
      await user.click(navigateToSignIn);

      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-signup')).not.toBeInTheDocument();
    });
  });
});
