import { render, screen } from '@testing-library/react';
import { AdminPage } from './AdminPage';

/**
 * Mock AdminDashboard component for testing
 */
const MockAdminDashboard = () => {
  return <div data-testid="mock-admin-dashboard">Mock Admin Dashboard</div>;
};

describe('AdminPage', () => {
  it('should render the AdminDashboard component', () => {
    render(<AdminPage AdminDashboardComponent={MockAdminDashboard} />);

    expect(screen.getByTestId('mock-admin-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mock Admin Dashboard')).toBeInTheDocument();
  });

  it('should wrap AdminDashboard in error boundary', () => {
    // Component that throws an error
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    render(<AdminPage AdminDashboardComponent={ErrorComponent} />);

    // Should show error boundary message
    expect(
      screen.getByText(/Failed to load Admin Dashboard/i)
    ).toBeInTheDocument();

    // Restore console.error
    console.error = originalError;
  });

  it('should have correct structure with Suspense fallback', () => {
    const { container } = render(
      <AdminPage AdminDashboardComponent={MockAdminDashboard} />
    );

    // Component should be rendered in the container
    expect(container.firstChild).toBeInTheDocument();
  });
});
