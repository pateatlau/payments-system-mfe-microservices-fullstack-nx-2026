import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { ReactNode } from 'react';
import { AppRoutes } from './AppRoutes';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock ProtectedRoute to simulate its behavior based on auth state
jest.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => {
    // Access the mock to get current auth state
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) {
      return <div data-testid="loading">Loading...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/signin" replace />;
    }
    return <>{children}</>;
  },
}));

// Mock the page components
jest.mock('../pages/SignInPage', () => ({
  SignInPage: () => <div data-testid="signin-page">SignInPage</div>,
}));

jest.mock('../pages/SignUpPage', () => ({
  SignUpPage: () => <div data-testid="signup-page">SignUpPage</div>,
}));

jest.mock('../pages/PaymentsPage', () => ({
  PaymentsPage: () => <div data-testid="payments-page">PaymentsPage</div>,
}));

jest.mock('../pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">HomePage</div>,
}));

// Mock components for DI
const MockSignIn = () => <div>Mock SignIn</div>;
const MockSignUp = () => <div>Mock SignUp</div>;
const MockPayments = () => <div>Mock Payments</div>;

describe('AppRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialEntries: string[] = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes
          SignInComponent={MockSignIn}
          SignUpComponent={MockSignUp}
          PaymentsComponent={MockPayments}
        />
      </MemoryRouter>
    );
  };

  describe('Root route (/)', () => {
    it('redirects to /signin when not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/']);

      // Should redirect to signin (MemoryRouter handles this internally)
      // The redirect happens via Navigate component
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });

    it('redirects to /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(['/']);

      // Should redirect to payments (MemoryRouter handles this internally)
      expect(screen.getByTestId('payments-page')).toBeInTheDocument();
    });
  });

  describe('Authentication routes', () => {
    it('renders SignInPage at /signin', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/signin']);

      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.getByText('SignInPage')).toBeInTheDocument();
    });

    it('renders SignUpPage at /signup', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/signup']);

      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
      expect(screen.getByText('SignUpPage')).toBeInTheDocument();
    });
  });

  describe('Protected routes', () => {
    it('renders PaymentsPage at /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter(['/payments']);

      expect(screen.getByTestId('payments-page')).toBeInTheDocument();
      expect(screen.getByText('PaymentsPage')).toBeInTheDocument();
    });

    it('redirects to /signin at /payments when not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/payments']);

      // Should redirect to signin via ProtectedRoute
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.queryByTestId('payments-page')).not.toBeInTheDocument();
    });

    it('shows loading state while checking auth at /payments', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRouter(['/payments']);

      // Should show loading state via ProtectedRoute
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('payments-page')).not.toBeInTheDocument();
    });
  });

  describe('Other routes', () => {
    it('renders HomePage at /home', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/home']);

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByText('HomePage')).toBeInTheDocument();
    });

    it('redirects unknown routes to root and then to signin', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter(['/unknown-route']);

      // Should redirect to root, then to signin
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });
  });
});
