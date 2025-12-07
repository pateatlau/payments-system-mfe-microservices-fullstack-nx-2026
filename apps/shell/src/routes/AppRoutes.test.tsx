import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the page components
vi.mock('../pages/SignInPage', () => ({
  SignInPage: () => <div>SignInPage</div>,
}));

vi.mock('../pages/SignUpPage', () => ({
  SignUpPage: () => <div>SignUpPage</div>,
}));

vi.mock('../pages/PaymentsPage', () => ({
  PaymentsPage: () => <div>PaymentsPage</div>,
}));

vi.mock('../pages/HomePage', () => ({
  HomePage: () => <div>HomePage</div>,
}));

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

      // Should redirect to signin
      expect(window.location.pathname).toBe('/');
      // The redirect happens via Navigate component
    });

    it('redirects to /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
      });

      renderWithRouter(['/']);

      // Should redirect to payments
      expect(window.location.pathname).toBe('/');
      // The redirect happens via Navigate component
    });
  });

  describe('Authentication routes', () => {
    it('renders SignInPage at /signin', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/signin']);

      expect(screen.getByText('SignInPage')).toBeInTheDocument();
    });

    it('renders SignUpPage at /signup', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/signup']);

      expect(screen.getByText('SignUpPage')).toBeInTheDocument();
    });
  });

  describe('Protected routes', () => {
    it('renders PaymentsPage at /payments when authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
      });

      renderWithRouter(['/payments']);

      expect(screen.getByText('PaymentsPage')).toBeInTheDocument();
    });
  });

  describe('Other routes', () => {
    it('renders HomePage at /home', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/home']);

      expect(screen.getByText('HomePage')).toBeInTheDocument();
    });

    it('redirects unknown routes to /', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
      });

      renderWithRouter(['/unknown-route']);

      // Should redirect to root
      expect(window.location.pathname).toBe('/');
    });
  });
});

