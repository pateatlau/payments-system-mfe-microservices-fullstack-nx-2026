import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { HomePage } from '../pages/HomePage';

/**
 * AppRoutes component
 * Defines all routes for the shell application
 */
export function AppRoutes() {
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
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected routes - require authentication */}
      <Route path="/payments" element={<PaymentsPage />} />

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

