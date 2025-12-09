/**
 * App Component Tests
 */

import { render, screen } from '@testing-library/react';
import { useAuthStore } from 'shared-auth-store';
import App from './app';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

describe('App', () => {
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

  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should display admin dashboard', () => {
    render(<App />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
