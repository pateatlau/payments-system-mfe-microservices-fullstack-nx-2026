import Layout from '../components/Layout';
import { AppRoutes, AppRoutesProps } from '../routes/AppRoutes';

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
    PaymentsComponent: AppRoutesProps['PaymentsComponent'];
  };
}

/**
 * App component
 *
 * Main application component that renders the Layout and AppRoutes.
 * Uses dependency injection pattern for testability.
 *
 * In production (main.tsx), pass the actual remote components.
 * In tests, pass mock components or let AppRoutes use its own mocks.
 */
export function App({ remotes }: AppProps = {}) {
  // If remotes are provided, pass them to AppRoutes
  // Otherwise, AppRoutes will need to handle it (or tests will mock AppRoutes)
  if (remotes) {
    return (
      <Layout>
        <AppRoutes
          SignInComponent={remotes.SignInComponent}
          SignUpComponent={remotes.SignUpComponent}
          PaymentsComponent={remotes.PaymentsComponent}
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
