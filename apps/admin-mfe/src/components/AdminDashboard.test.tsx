/**
 * Admin Dashboard Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuthStore } from 'shared-auth-store';
import AdminDashboard from './AdminDashboard';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Mock user data
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
      isAuthenticated: true,
    });
  });

  it('should render admin dashboard', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should display welcome message with user name and role', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/Welcome back, Admin User/)).toBeInTheDocument();
    expect(screen.getByText(/Role: ADMIN/)).toBeInTheDocument();
  });

  it('should render navigation tabs', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Payment Reports')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('should show overview tab content by default', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/Demo Data/)).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should load and display statistics after loading', async () => {
    render(<AdminDashboard />);

    // Wait for loading to complete and stats to appear
    await waitFor(
      () => {
        expect(screen.getByText('1247')).toBeInTheDocument();
        expect(screen.getByText('89')).toBeInTheDocument();
        expect(screen.getByText('$45,231')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should load and display recent activity', async () => {
    render(<AdminDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('New user registered')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should switch to users tab', async () => {
    render(<AdminDashboard />);

    const usersTab = screen.getByText('User Management');
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(
        screen.getByText(/User Management.*will be implemented/)
      ).toBeInTheDocument();
    });
  });

  it('should switch to payments tab', async () => {
    render(<AdminDashboard />);

    const paymentsTab = screen.getByText('Payment Reports');
    fireEvent.click(paymentsTab);

    await waitFor(() => {
      expect(
        screen.getByText(/Payment Reports.*will be implemented/)
      ).toBeInTheDocument();
    });
  });

  it('should switch to audit logs tab', async () => {
    render(<AdminDashboard />);

    const auditTab = screen.getByText('Audit Logs');
    fireEvent.click(auditTab);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(
        screen.getByText('Track system activity and user actions')
      ).toBeInTheDocument();
    });
  });

  it('should switch to system tab', async () => {
    render(<AdminDashboard />);

    const systemTab = screen.getByText('System Health');
    fireEvent.click(systemTab);

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(
        screen.getByText('Real-time monitoring of system services')
      ).toBeInTheDocument();
    });
  });

  it('should render quick actions', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Check for action cards
    const actionButtons = screen.getAllByText(/Open →|Coming Soon/);
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('should handle missing user name gracefully', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      isAuthenticated: true,
    });

    render(<AdminDashboard />);

    expect(screen.getByText(/Welcome back, Admin/)).toBeInTheDocument();
  });

  it('should handle null user gracefully', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<AdminDashboard />);

    expect(screen.getByText(/Welcome back, Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Role: N\/A/)).toBeInTheDocument();
  });
});
