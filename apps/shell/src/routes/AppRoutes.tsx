import { Routes, Route, Navigate } from 'react-router-dom';
import { ComponentType } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { SignInPage, SignInComponentProps } from '../pages/SignInPage';
import { SignUpPage, SignUpComponentProps } from '../pages/SignUpPage';
import { PaymentsPage, PaymentsComponentProps } from '../pages/PaymentsPage';
import { AdminPage, AdminDashboardComponentProps } from '../pages/AdminPage';
import { HomePage } from '../pages/HomePage';
import { ProtectedRoute } from '../components/ProtectedRoute';

/**
 * Props for AppRoutes - allows dependency injection for testing
 */
export interface AppRoutesProps {
  /**
   * SignIn component to use. Required for proper DI pattern.
   */
  SignInComponent: ComponentType<SignInComponentProps>;
  /**
   * SignUp component to use. Required for proper DI pattern.
   */
  SignUpComponent: ComponentType<SignUpComponentProps>;
  /**
   * PaymentsPage component to use. Required for proper DI pattern.
   */
  PaymentsComponent: ComponentType<PaymentsComponentProps>;
  /**
   * AdminDashboard component to use. Required for proper DI pattern.
   */
  AdminDashboardComponent: ComponentType<AdminDashboardComponentProps>;
}

/**
 * AppRoutes component
 * Defines all routes for the shell application.
 * Uses dependency injection pattern for testability.
 *
 * @example
 * // Production usage (in App.tsx) - imports remotes dynamically
 * import { SignInRemote, SignUpRemote, PaymentsPageRemote, AdminDashboardRemote } from '../remotes';
 * <AppRoutes
 *   SignInComponent={SignInRemote}
 *   SignUpComponent={SignUpRemote}
 *   PaymentsComponent={PaymentsPageRemote}
 *   AdminDashboardComponent={AdminDashboardRemote}
 * />
 *
 * @example
 * // Test usage - pass mock components
 * <AppRoutes
 *   SignInComponent={MockSignIn}
 *   SignUpComponent={MockSignUp}
 *   PaymentsComponent={MockPayments}
 *   AdminDashboardComponent={MockAdminDashboard}
 * />
 */
export function AppRoutes({
  SignInComponent,
  SignUpComponent,
  PaymentsComponent,
  AdminDashboardComponent,
}: AppRoutesProps) {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Root route - redirect based on auth state */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/payments" replace />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      {/* Home page (for testing/development) */}
      <Route path="/home" element={<HomePage />} />

      {/* Authentication routes - only accessible when not authenticated */}
      <Route
        path="/signin"
        element={<SignInPage SignInComponent={SignInComponent} />}
      />
      <Route
        path="/signup"
        element={<SignUpPage SignUpComponent={SignUpComponent} />}
      />

      {/* Protected routes - require authentication */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage PaymentsComponent={PaymentsComponent} />
          </ProtectedRoute>
        }
      />

      {/* Admin route - requires ADMIN role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminPage AdminDashboardComponent={AdminDashboardComponent} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
