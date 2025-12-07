import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { AppRoutes } from '../routes/AppRoutes';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock components for testing
const MockSignIn = vi.fn(({ onSuccess, onNavigateToSignUp }: any) => (
  <div data-testid="mock-signin">
    <button onClick={onSuccess} data-testid="signin-success">
      Sign In Success
    </button>
    <button onClick={onNavigateToSignUp} data-testid="navigate-signup">
      Go to Sign Up
    </button>
  </div>
));

const MockSignUp = vi.fn(({ onSuccess, onNavigateToSignIn }: any) => (
  <div data-testid="mock-signup">
    <button onClick={onSuccess} data-testid="signup-success">
      Sign Up Success
    </button>
    <button onClick={onNavigateToSignIn} data-testid="navigate-signin">
      Go to Sign In
    </button>
  </div>
));

const MockPaymentsPage = vi.fn(() => (
  <div data-testid="mock-payments">
    <h1>Payments Page</h1>
  </div>
));

// Mock ProtectedRoute
vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) {
      return <div data-testid="loading">Loading...</div>;
    }
    if (!isAuthenticated) {
      return <div data-testid="redirect-to-signin">Redirecting to sign in...</div>;
    }
    return <>{children}</>;
  },
}));

describe('App Integration Tests', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    mockSignup.mockResolvedValue(undefined);
  });

  describe('Unauthenticated User Flow', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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

    it('should provide onSuccess callback to SignIn component', () => {
      // Start unauthenticated
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      // This test verifies the integration between components
    });
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' },
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' },
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      expect(screen.queryByTestId('redirect-to-signin')).not.toBeInTheDocument();
    });

    it('should redirect authenticated user from /signin to /payments', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' },
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' },
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        signup: mockSignup,
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

