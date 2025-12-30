/**
 * Admin Dashboard Component Tests
 */

import { render, screen, fireEvent, waitFor } from '../test-utils';
import { useAuthStore } from 'shared-auth-store';
import AdminDashboard from './AdminDashboard';

// Mock the auth store
const mockAuthStore = {
  user: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  isAuthenticated: true,
  accessToken: 'mock-token',
  refreshToken: 'mock-refresh-token',
};

jest.mock('shared-auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(), {
    getState: () => mockAuthStore,
  }),
}));

// Mock the dashboard API
jest.mock('../api/dashboard', () => ({
  getDashboardStats: jest.fn(),
  getRecentActivity: jest.fn(),
}));

// Mock the users API
jest.mock('../api/users', () => ({
  getUsers: jest.fn(),
  updateUserRole: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock the audit logs API
jest.mock('../api/audit-logs', () => ({
  getAuditLogs: jest.fn(),
  getAvailableActions: jest.fn(),
}));

// Note: paymentsMfe/PaymentReports is mocked via moduleNameMapper in jest.config.cts

// Mock the system health API
jest.mock('../api/system-health', () => ({
  getSystemHealth: jest.fn(),
  getServiceDisplayName: jest.fn((key: string) => key),
  getStatusBadgeVariant: jest.fn(() => 'default'),
  getStatusIcon: jest.fn(() => '✅'),
}));

// Mock the dashboard hooks
jest.mock('../hooks/useDashboardUpdates', () => ({
  useDashboardUpdates: jest.fn(),
}));

import { getDashboardStats, getRecentActivity } from '../api/dashboard';
import { getUsers } from '../api/users';
import { getAuditLogs, getAvailableActions } from '../api/audit-logs';
import { getSystemHealth } from '../api/system-health';

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user data
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore);

    // Mock dashboard stats API
    (getDashboardStats as jest.Mock).mockResolvedValue({
      totalUsers: 1247,
      activePayments: 89,
      totalVolume: 45231,
      systemHealth: '100%',
    });

    // Mock recent activity API
    (getRecentActivity as jest.Mock).mockResolvedValue([
      {
        id: '1',
        action: 'USER_REGISTERED',
        userEmail: 'john.doe@example.com',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: '2',
        action: 'PAYMENT_COMPLETED',
        userEmail: 'alice.smith@example.com',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ]);

    // Mock users API
    (getUsers as jest.Mock).mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    // Mock audit logs API
    (getAuditLogs as jest.Mock).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    (getAvailableActions as jest.Mock).mockResolvedValue([]);

    // Mock system health API
    (getSystemHealth as jest.Mock).mockResolvedValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        authService: 'healthy',
        paymentsService: 'healthy',
      },
      version: '1.0.0',
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

    expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByText('User Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Payment Reports').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Audit Logs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('System Health').length).toBeGreaterThan(0);
  });

  it('should show overview tab content by default', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
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
        expect(screen.getByText('user registered')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should switch to users tab', async () => {
    render(<AdminDashboard />);

    // Click the tab button (not the QuickAction card)
    const usersTabs = screen.getAllByText('User Management');
    const usersTab = usersTabs.find(
      el => el.tagName === 'BUTTON' && el.closest('nav')
    );
    fireEvent.click(usersTab!);

    await waitFor(() => {
      expect(
        screen.getByText(/Manage users, roles, and permissions/)
      ).toBeInTheDocument();
    });
  });

  it('should switch to payments tab', async () => {
    render(<AdminDashboard />);

    // Click the tab button (not the QuickAction card)
    const paymentsTabs = screen.getAllByText('Payment Reports');
    const paymentsTab = paymentsTabs.find(
      el => el.tagName === 'BUTTON' && el.closest('nav')
    );
    fireEvent.click(paymentsTab!);

    await waitFor(() => {
      expect(screen.getByTestId('payment-reports-mock')).toBeInTheDocument();
    });
  });

  it('should switch to audit logs tab', async () => {
    render(<AdminDashboard />);

    // Click the tab button (not the QuickAction card)
    const auditTabs = screen.getAllByText('Audit Logs');
    const auditTab = auditTabs.find(
      el => el.tagName === 'BUTTON' && el.closest('nav')
    );
    fireEvent.click(auditTab!);

    await waitFor(() => {
      expect(
        screen.getByText('Track system activity and user actions')
      ).toBeInTheDocument();
    });
  });

  it('should switch to system tab', async () => {
    render(<AdminDashboard />);

    // Click the tab button (not the QuickAction card)
    const systemTabs = screen.getAllByText('System Health');
    const systemTab = systemTabs.find(
      el => el.tagName === 'BUTTON' && el.closest('nav')
    );
    fireEvent.click(systemTab!);

    await waitFor(() => {
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
      ...mockAuthStore,
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
      ...mockAuthStore,
      user: null,
      isAuthenticated: false,
    });

    render(<AdminDashboard />);

    expect(screen.getByText(/Welcome back, Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Role: N\/A/)).toBeInTheDocument();
  });
});
