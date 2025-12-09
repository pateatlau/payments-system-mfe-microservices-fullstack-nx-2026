import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Helper to render with router
function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/protected'] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/signin"
          element={<div data-testid="signin-page">Sign In Page</div>}
        />
        <Route
          path="/custom-login"
          element={<div data-testid="custom-login">Custom Login</div>}
        />
        <Route
          path="/payments"
          element={<div data-testid="payments-page">Payments Page</div>}
        />
        <Route
          path="/access-denied"
          element={<div data-testid="access-denied">Access Denied</div>}
        />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('renders children when authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not show loading state when authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(
        screen.queryByText('Checking authentication...')
      ).not.toBeInTheDocument();
    });

    it('does not redirect when authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it('redirects to /signin by default', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to custom path when redirectTo is provided', () => {
      renderWithRouter(
        <ProtectedRoute redirectTo="/custom-login">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('custom-login')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('does not render children when not authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('when auth is loading', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });
    });

    it('shows default loading component', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(
        screen.getByText('Checking authentication...')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows custom loading component when provided', () => {
      renderWithRouter(
        <ProtectedRoute
          loadingComponent={
            <div data-testid="custom-loader">Custom Loading...</div>
          }
        >
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(
        screen.queryByText('Checking authentication...')
      ).not.toBeInTheDocument();
    });

    it('does not redirect while loading', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
    });

    it('does not render children while loading', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders loading spinner with proper structure', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Check loading text is present for screen readers
      expect(
        screen.getByText('Checking authentication...')
      ).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles transition from loading to authenticated', () => {
      // Start with loading state
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(
        screen.getByText('Checking authentication...')
      ).toBeInTheDocument();

      // Transition to authenticated
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/signin"
              element={<div data-testid="signin-page">Sign In Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('handles transition from loading to not authenticated', () => {
      // Start with loading state
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(
        screen.getByText('Checking authentication...')
      ).toBeInTheDocument();

      // Transition to not authenticated
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/signin"
              element={<div data-testid="signin-page">Sign In Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });
  });

  describe('role-based access control', () => {
    describe('when user has required role', () => {
      beforeEach(() => {
        (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue(
          {
            isAuthenticated: true,
            isLoading: false,
            hasRole: jest.fn((role: UserRole) => role === UserRole.ADMIN),
            hasAnyRole: jest.fn((roles: UserRole[]) =>
              roles.includes(UserRole.ADMIN)
            ),
          }
        );
      });

      it('renders children when user has single required role', () => {
        renderWithRouter(
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
        expect(screen.queryByTestId('payments-page')).not.toBeInTheDocument();
      });

      it('renders children when user has one of multiple required roles', () => {
        renderWithRouter(
          <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.VENDOR]}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });
    });

    describe('when user does not have required role', () => {
      beforeEach(() => {
        (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue(
          {
            isAuthenticated: true,
            isLoading: false,
            hasRole: jest.fn((role: UserRole) => role === UserRole.CUSTOMER),
            hasAnyRole: jest.fn((roles: UserRole[]) =>
              roles.includes(UserRole.CUSTOMER)
            ),
          }
        );
      });

      it('redirects to default access denied path when user lacks required role', () => {
        renderWithRouter(
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByTestId('payments-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      });

      it('redirects to custom access denied path when provided', () => {
        renderWithRouter(
          <ProtectedRoute
            requiredRole={UserRole.ADMIN}
            accessDeniedRedirect="/access-denied"
          >
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      });

      it('redirects when user lacks any of multiple required roles', () => {
        renderWithRouter(
          <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.VENDOR]}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByTestId('payments-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      });
    });

    describe('when not authenticated with role requirement', () => {
      beforeEach(() => {
        (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue(
          {
            isAuthenticated: false,
            isLoading: false,
            hasRole: jest.fn(),
            hasAnyRole: jest.fn(),
          }
        );
      });

      it('redirects to signin before checking role', () => {
        renderWithRouter(
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        );

        // Should redirect to signin, not access denied
        expect(screen.getByTestId('signin-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
        expect(screen.queryByTestId('payments-page')).not.toBeInTheDocument();
      });
    });
  });
});
