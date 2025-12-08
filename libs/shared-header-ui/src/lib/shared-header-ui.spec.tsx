import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Header } from './shared-header-ui';
import { useAuthStore } from 'shared-auth-store';
import type { User } from 'shared-auth-store';

// Simple matchers for testing
expect.extend({
  toBeInTheDocument(received: HTMLElement) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        `expected element ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  toHaveClass(received: HTMLElement, ...classes: string[]) {
    const classList = Array.from(received.classList);
    const pass = classes.every(cls => classList.includes(cls));
    return {
      pass,
      message: () =>
        `expected element to have classes ${classes.join(', ')}, but has ${classList.join(', ')}`,
    };
  },
});

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof jest.fn>;

// Helper function to render with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Header', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      hasRole: jest.fn(() => false),
    });
  });

  describe('when not authenticated', () => {
    it('should render branding', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Payments System')).toBeInTheDocument();
    });

    it('should render custom branding when provided', () => {
      renderWithRouter(<Header branding="Custom Brand" />);
      expect(screen.getByText('Custom Brand')).toBeInTheDocument();
    });

    it('should show sign in and sign up buttons', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should not show user info', () => {
      renderWithRouter(<Header />);
      expect(
        screen.queryByText(/customer|vendor|admin/i)
      ).not.toBeInTheDocument();
    });

    it('should not show navigation items', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByText('Payments')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn((role: string) => role === 'CUSTOMER'),
      });
    });

    it('should show user name and role', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('customer')).toBeInTheDocument();
    });

    it('should show logout button', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should show navigation items', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should call custom onLogout when provided', async () => {
      const customLogout = jest.fn();
      const user = userEvent.setup();
      renderWithRouter(<Header onLogout={customLogout} />);

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(customLogout).toHaveBeenCalledTimes(1);
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe('role-based navigation', () => {
    it('should show Reports link for VENDOR role', () => {
      const vendorUser: User = {
        id: '1',
        email: 'vendor@example.com',
        name: 'Vendor User',
        role: 'VENDOR',
      };

      mockUseAuthStore.mockReturnValue({
        user: vendorUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn((role: string) => role === 'VENDOR'),
      });

      renderWithRouter(<Header />);
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('should not show Reports link for CUSTOMER role', () => {
      const customerUser: User = {
        id: '1',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER',
      };

      mockUseAuthStore.mockReturnValue({
        user: customerUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn((role: string) => role === 'CUSTOMER'),
      });

      renderWithRouter(<Header />);
      expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    });

    it('should not show Reports link for ADMIN role', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      };

      mockUseAuthStore.mockReturnValue({
        user: adminUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn((role: string) => role === 'ADMIN'),
      });

      renderWithRouter(<Header />);
      expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should have mobile menu button', () => {
      renderWithRouter(<Header />);
      const menuButton = screen.getByLabelText('Menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass('md:hidden');
    });

    it('should hide navigation items on mobile', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn(() => false),
      });

      renderWithRouter(<Header />);
      const paymentsLink = screen.getByText('Payments');
      const parentDiv = paymentsLink.closest('div');
      expect(parentDiv).not.toBeNull();
      if (parentDiv) {
        const classList = Array.from(parentDiv.classList);
        expect(classList).toContain('hidden');
        expect(classList).toContain('md:flex');
      }
    });

    it('should hide user info on small screens', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn(() => false),
      });

      renderWithRouter(<Header />);
      const userInfo = screen.getByText('Test User').closest('div');
      expect(userInfo).toHaveClass('hidden', 'sm:flex');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels when authenticated', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        logout: mockLogout,
        hasRole: jest.fn(() => false),
      });

      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Logout')).toBeInTheDocument();
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    });

    it('should have menu button aria label when not authenticated', () => {
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    });
  });
});
