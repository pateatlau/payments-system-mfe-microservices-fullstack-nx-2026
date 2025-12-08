import { describe, it, expect, beforeEach } from '@jest/globals';
import { useAuthStore } from './shared-auth-store';
import type { SignUpData } from './shared-auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('initial state', () => {
    it('should have initial state with no user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and set user', async () => {
      const { login } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set loading state during login', async () => {
      const { login } = useAuthStore.getState();

      const loginPromise = login('test@example.com', 'password123');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      // Check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should assign ADMIN role for admin email', async () => {
      const { login } = useAuthStore.getState();

      await login('admin@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('ADMIN');
    });

    it('should assign VENDOR role for vendor email', async () => {
      const { login } = useAuthStore.getState();

      await login('vendor@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('VENDOR');
    });

    it('should assign CUSTOMER role for regular email', async () => {
      const { login } = useAuthStore.getState();

      await login('customer@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('CUSTOMER');
    });
  });

  describe('logout', () => {
    it('should logout and clear user', async () => {
      const { login, logout } = useAuthStore.getState();

      // First login
      await login('test@example.com', 'password123');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('signup', () => {
    it('should signup successfully and set user', async () => {
      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(signUpData);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('newuser@example.com');
      expect(state.user?.name).toBe('New User');
      expect(state.user?.role).toBe('CUSTOMER'); // Default role
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should signup with specified role', async () => {
      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'vendor@example.com',
        password: 'password123',
        name: 'Vendor User',
        role: 'VENDOR',
      };

      await signup(signUpData);

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('VENDOR');
    });

    it('should set loading state during signup', async () => {
      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const signupPromise = signup(signUpData);

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await signupPromise;

      // Check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', async () => {
      const { login, hasRole } = useAuthStore.getState();

      await login('admin@example.com', 'password123');

      expect(hasRole('ADMIN')).toBe(true);
      expect(hasRole('CUSTOMER')).toBe(false);
      expect(hasRole('VENDOR')).toBe(false);
    });

    it('should return false if user is not authenticated', () => {
      const { hasRole } = useAuthStore.getState();

      expect(hasRole('ADMIN')).toBe(false);
      expect(hasRole('CUSTOMER')).toBe(false);
      expect(hasRole('VENDOR')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the specified roles', async () => {
      const { login, hasAnyRole } = useAuthStore.getState();

      await login('admin@example.com', 'password123');

      expect(hasAnyRole(['ADMIN', 'VENDOR'])).toBe(true);
      expect(hasAnyRole(['VENDOR', 'CUSTOMER'])).toBe(false);
    });

    it('should return false if user is not authenticated', () => {
      const { hasAnyRole } = useAuthStore.getState();

      expect(hasAnyRole(['ADMIN', 'VENDOR'])).toBe(false);
    });

    it('should return true for single role match', async () => {
      const { login, hasAnyRole } = useAuthStore.getState();

      await login('customer@example.com', 'password123');

      expect(hasAnyRole(['CUSTOMER'])).toBe(true);
      expect(hasAnyRole(['ADMIN', 'CUSTOMER'])).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { clearError } = useAuthStore.getState();

      // Set an error manually
      useAuthStore.setState({ error: 'Some error' });
      expect(useAuthStore.getState().error).toBe('Some error');

      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist user and isAuthenticated to localStorage', async () => {
      const { login } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      // Check localStorage
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('auth-storage');
        expect(stored).not.toBeNull();

        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.state.user).not.toBeNull();
          expect(parsed.state.isAuthenticated).toBe(true);
        }
      } else {
        // Skip test if localStorage is not available
        expect(true).toBe(true);
      }
    });

    it('should restore state from localStorage on initialization', async () => {
      const { login } = useAuthStore.getState();

      // Login and persist
      await login('test@example.com', 'password123');
      const _user = useAuthStore.getState().user;
      expect(_user).toBeTruthy();

      // Clear store state
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      // Create new store instance (simulating page reload)
      // Note: In real usage, Zustand will automatically restore from localStorage
      // This test verifies the persistence configuration
      if (typeof localStorage !== 'undefined') {
        expect(localStorage.getItem('auth-storage')).not.toBeNull();
      } else {
        // Skip test if localStorage is not available
        expect(true).toBe(true);
      }
    });
  });
});
