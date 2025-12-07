import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the remotes module to prevent Module Federation imports during tests
vi.mock('../pages/remotes', () => ({
  SignInRemote: () => <div>Remote SignIn</div>,
  SignUpRemote: () => <div>Remote SignUp</div>,
  PaymentsPageRemote: () => <div>Remote PaymentsPage</div>,
}));

// Mock the page components - these mocks prevent Module Federation imports from being resolved
vi.mock('../pages/SignInPage', () => ({
  SignInPage: () => <div data-testid="signin-page">SignInPage</div>,
}));

vi.mock('../pages/SignUpPage', () => ({
  SignUpPage: () => <div data-testid="signup-page">SignUpPage</div>,
}));

vi.mock('../pages/PaymentsPage', () => ({
  PaymentsPage: () => <div data-testid="payments-page">PaymentsPage</div>,
}));

vi.mock('../pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">HomePage</div>,
}));

// Import AppRoutes after mocks are set up
import { AppRoutes } from './AppRoutes';

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntries: string[] = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    );
  };

  describe('Root route (/)', () => {
    it('redirects to /signin when not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/']);

      // Should redirect to signin (MemoryRouter handles this internally)
      // The redirect happens via Navigate component
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });

    it('redirects to /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
      });

      renderWithRouter(['/']);

      // Should redirect to payments (MemoryRouter handles this internally)
      expect(screen.getByTestId('payments-page')).toBeInTheDocument();
    });
  });

  describe('Authentication routes', () => {
    it('renders SignInPage at /signin', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/signin']);

      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.getByText('SignInPage')).toBeInTheDocument();
    });

    it('renders SignUpPage at /signup', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/signup']);

      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
      expect(screen.getByText('SignUpPage')).toBeInTheDocument();
    });
  });

  describe('Protected routes', () => {
    it('renders PaymentsPage at /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
      });

      renderWithRouter(['/payments']);

      expect(screen.getByTestId('payments-page')).toBeInTheDocument();
      expect(screen.getByText('PaymentsPage')).toBeInTheDocument();
    });
  });

  describe('Other routes', () => {
    it('renders HomePage at /home', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/home']);

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByText('HomePage')).toBeInTheDocument();
    });

    it('redirects unknown routes to root and then to signin', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/unknown-route']);

      // Should redirect to root, then to signin
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });
  });
});
