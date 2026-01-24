import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { AppRoutes, AppRoutesProps } from '../routes/AppRoutes';
import { useEventBusIntegration } from '../hooks';
import { useRouteAnnouncer } from 'shared-utils';

/**
 * Props for App component - allows dependency injection for testing
 */
export interface AppProps {
  /**
   * Remote components to pass to AppRoutes.
   * In production, these come from ../remotes.
   * In tests, pass mock components.
   */
  remotes?: {
    SignInComponent: AppRoutesProps['SignInComponent'];
    SignUpComponent: AppRoutesProps['SignUpComponent'];
    ForgotPasswordComponent: AppRoutesProps['ForgotPasswordComponent'];
    ResetPasswordComponent: AppRoutesProps['ResetPasswordComponent'];
    VerifyEmailComponent: AppRoutesProps['VerifyEmailComponent'];
    OAuthCallbackComponent: AppRoutesProps['OAuthCallbackComponent'];
    MfaRecommendationComponent: AppRoutesProps['MfaRecommendationComponent'];
    PaymentsComponent: AppRoutesProps['PaymentsComponent'];
    ReportsComponent: AppRoutesProps['ReportsComponent'];
    AdminDashboardComponent: AppRoutesProps['AdminDashboardComponent'];
    ProfilePageComponent: AppRoutesProps['ProfilePageComponent'];
  };
}

/**
 * App component
 *
 * Main application component that renders the Layout and AppRoutes.
 * Uses dependency injection pattern for testability.
 * Integrates event bus for inter-MFE communication.
 *
 * In production (main.tsx), pass the actual remote components.
 * In tests, pass mock components or let AppRoutes use its own mocks.
 */
export function App({ remotes }: AppProps = {}) {
  // Get current location for route announcements
  const location = useLocation();

  // Announce route changes to screen readers for accessibility (WCAG 4.1.3)
  useRouteAnnouncer(location.pathname);

  // Initialize event bus integration
  // Subscribes to auth and payment events, handles navigation
  useEventBusIntegration({
    enableAuthEvents: true,
    enablePaymentEvents: true,
    enableSystemEvents: true,
    debug: process.env['NODE_ENV'] === 'development',
  });

  // If remotes are provided, pass them to AppRoutes
  // Otherwise, AppRoutes will need to handle it (or tests will mock AppRoutes)
  if (remotes) {
    return (
      <Layout>
        <AppRoutes
          SignInComponent={remotes.SignInComponent}
          SignUpComponent={remotes.SignUpComponent}
          ForgotPasswordComponent={remotes.ForgotPasswordComponent}
          ResetPasswordComponent={remotes.ResetPasswordComponent}
          VerifyEmailComponent={remotes.VerifyEmailComponent}
          OAuthCallbackComponent={remotes.OAuthCallbackComponent}
          MfaRecommendationComponent={remotes.MfaRecommendationComponent}
          PaymentsComponent={remotes.PaymentsComponent}
          ReportsComponent={remotes.ReportsComponent}
          AdminDashboardComponent={remotes.AdminDashboardComponent}
          ProfilePageComponent={remotes.ProfilePageComponent}
        />
      </Layout>
    );
  }

  // For tests that mock AppRoutes entirely, we don't need remotes
  // This path is used when tests mock the entire AppRoutes component
  return (
    <Layout>
      {/* AppRoutes will be mocked in tests */}
      <div data-testid="app-routes-placeholder">Routes not configured</div>
    </Layout>
  );
}

export default App;
