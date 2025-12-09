import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { AppRoutes } from './AppRoutes';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock components
const MockSignIn = () => <div data-testid="mock-signin">Mock Sign In</div>;
const MockSignUp = () => <div data-testid="mock-signup">Mock Sign Up</div>;
const MockPayments = () => <div data-testid="mock-payments">Mock Payments</div>;
const MockAdminDashboard = () => (
  <div data-testid="mock-admin">Mock Admin Dashboard</div>
);

describe('AppRoutes - Admin Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is ADMIN', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasRole: jest.fn((role: UserRole) => role === UserRole.ADMIN),
        hasAnyRole: jest.fn((roles: UserRole[]) =>
          roles.includes(UserRole.ADMIN)
        ),
      });
    });

    it('allows access to admin route', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-admin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-payments')).not.toBeInTheDocument();
    });

    it('redirects root to payments (not admin)', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      // Root should redirect to payments even for admin users
      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-admin')).not.toBeInTheDocument();
    });
  });

  describe('when user is CUSTOMER', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasRole: jest.fn((role: UserRole) => role === UserRole.CUSTOMER),
        hasAnyRole: jest.fn((roles: UserRole[]) =>
          roles.includes(UserRole.CUSTOMER)
        ),
      });
    });

    it('redirects to payments when accessing admin route', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      // Should be redirected to payments (default access denied redirect)
      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-admin')).not.toBeInTheDocument();
    });

    it('allows access to payments route', () => {
      render(
        <MemoryRouter initialEntries={['/payments']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
    });
  });

  describe('when user is VENDOR', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasRole: jest.fn((role: UserRole) => role === UserRole.VENDOR),
        hasAnyRole: jest.fn((roles: UserRole[]) =>
          roles.includes(UserRole.VENDOR)
        ),
      });
    });

    it('redirects to payments when accessing admin route', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-payments')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-admin')).not.toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
      });
    });

    it('redirects to signin when accessing admin route', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      // Should redirect to signin before checking role
      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-admin')).not.toBeInTheDocument();
    });

    it('redirects root to signin', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
    });
  });

  describe('route precedence', () => {
    it('admin route takes precedence over catch-all', () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasRole: jest.fn((role: UserRole) => role === UserRole.ADMIN),
        hasAnyRole: jest.fn((roles: UserRole[]) =>
          roles.includes(UserRole.ADMIN)
        ),
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes
            SignInComponent={MockSignIn}
            SignUpComponent={MockSignUp}
            PaymentsComponent={MockPayments}
            AdminDashboardComponent={MockAdminDashboard}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-admin')).toBeInTheDocument();
    });
  });
});
