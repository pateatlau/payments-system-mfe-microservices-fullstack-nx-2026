/**
 * Admin Dashboard Component Tests
 */

import { render, screen } from '@testing-library/react';
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

  it('should display welcome message with user name', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText(/Welcome back, Admin User/)).toBeInTheDocument();
  });

  it('should display dashboard cards', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Payment Reports')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should display quick stats section', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Payments')).toBeInTheDocument();
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
});
