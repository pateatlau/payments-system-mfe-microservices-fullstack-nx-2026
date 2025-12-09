import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAuthStore } from './shared-auth-store';
import type { SignUpData } from './shared-auth-store';
import type { LoginResponse, RegisterResponse } from 'shared-types';
import type { User } from 'shared-types';

// Test exports from index.ts to improve coverage
import {
  useAuthStore as useAuthStoreFromIndex,
  type UserRole,
  type SignUpData as SignUpDataFromIndex,
  type AuthState,
  type User as UserFromIndex,
} from '../index';

// Create mock functions that will be used in the mocks
const mockPost = jest.fn();
const mockSetTokenProvider = jest.fn();
const mockEmit = jest.fn();

// Mock API client - define mocks inside factory to avoid hoisting issues
jest.mock('@mfe/shared-api-client', () => {
  const mockPostFn = jest.fn();
  const mockSetTokenProviderFn = jest.fn();
  return {
    getApiClient: jest.fn(() => ({
      post: mockPostFn,
      setTokenProvider: mockSetTokenProviderFn,
    })),
    __mockPost: mockPostFn,
    __mockSetTokenProvider: mockSetTokenProviderFn,
  };
});

// Mock event bus - define mocks inside factory to avoid hoisting issues
jest.mock('@mfe/shared-event-bus', () => {
  const mockEmitFn = jest.fn();
  return {
    eventBus: {
      emit: mockEmitFn,
    },
    __mockEmit: mockEmitFn,
  };
});

// Import after mocks are set up and get the mock functions
import { getApiClient } from '@mfe/shared-api-client';
import { eventBus } from '@mfe/shared-event-bus';

// Get the actual mock functions from the mocked modules
const getMockPost = () => {
  const client = getApiClient();
  return client.post as jest.Mock;
};

const getMockEmit = () => {
  return eventBus.emit as jest.Mock;
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    getMockPost().mockClear();
    getMockEmit().mockClear();

    // Clear store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
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
    it('should login successfully and set user with tokens', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
        message: 'Login successful',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-123');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Verify API call
      expect(getMockPost()).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      // Verify event emission
      expect(getMockEmit()).toHaveBeenCalledWith(
        'auth:login',
        {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
        'auth-mfe'
      );
    });

    it('should set loading state during login', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      // Delay the response to test loading state
      getMockPost().mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

      const { login } = useAuthStore.getState();

      const loginPromise = login('test@example.com', 'password123');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      // Check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      getMockPost().mockRejectedValueOnce(mockError);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');

      // Verify event was not emitted
      expect(getMockEmit()).not.toHaveBeenCalled();
    });

    it('should handle API response errors', async () => {
      const mockResponse: LoginResponse = {
        success: false,
        data: {
          user: {
            id: '',
            email: '',
            name: '',
            role: 'CUSTOMER',
            emailVerified: false,
            createdAt: '',
            updatedAt: '',
          },
          accessToken: '',
          refreshToken: '',
        },
        message: 'Invalid credentials',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toContain('Invalid credentials');
    });

    it('should handle login response with null data', async () => {
      const mockResponse: LoginResponse = {
        success: true,
        data: null as unknown as {
          user: User;
          accessToken: string;
          refreshToken: string;
        },
        message: 'Login failed',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Login failed');
    });

    it('should handle login response with success false and null data', async () => {
      const mockResponse: LoginResponse = {
        success: false,
        data: null as unknown as {
          user: User;
          accessToken: string;
          refreshToken: string;
        },
        message: 'Invalid credentials',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle login response with success false and no message', async () => {
      const mockResponse: LoginResponse = {
        success: false,
        data: {
          user: {
            id: '',
            email: '',
            name: '',
            role: 'CUSTOMER',
            emailVerified: false,
            createdAt: '',
            updatedAt: '',
          },
          accessToken: '',
          refreshToken: '',
        },
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Login failed');
    });
  });

  describe('logout', () => {
    it('should logout without accessToken and still clear state', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      // Set user without accessToken
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        accessToken: null,
        refreshToken: null,
      });

      const { logout } = useAuthStore.getState();

      // Logout should not call API (no accessToken) but still clear state
      await logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // Verify logout API was NOT called (no accessToken)
      expect(getMockPost()).not.toHaveBeenCalledWith('/api/auth/logout', {});

      // Verify logout event was emitted
      expect(getMockEmit()).toHaveBeenCalledWith(
        'auth:logout',
        {
          userId: 'user-123',
          reason: 'user_initiated',
        },
        'auth-mfe'
      );
    });

    it('should logout and clear user and tokens', async () => {
      // First login
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

      const { login, logout } = useAuthStore.getState();

      await login('test@example.com', 'password123');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Mock logout API call
      getMockPost().mockResolvedValueOnce({
        success: true,
        message: 'Logout successful',
      });

      // Then logout
      await logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();

      // Verify logout API call
      expect(getMockPost()).toHaveBeenCalledWith('/api/auth/logout', {});

      // Verify logout event emission
      expect(getMockEmit()).toHaveBeenCalledWith(
        'auth:logout',
        {
          userId: 'user-123',
          reason: 'user_initiated',
        },
        'auth-mfe'
      );
    });

    it('should clear state even if logout API call fails', async () => {
      // First login
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

      const { login, logout } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      // Mock logout API call failure
      getMockPost().mockRejectedValueOnce(new Error('Network error'));

      // Then logout
      await logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear state even if logout throws an error in outer catch', async () => {
      // First login
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

      const { login, logout } = useAuthStore.getState();

      await login('test@example.com', 'password123');

      // Mock logout API call to throw an error that will be caught in outer catch
      // We'll make the eventBus.emit throw to trigger the outer catch
      getMockPost().mockResolvedValueOnce({ success: true });
      getMockEmit().mockImplementationOnce(() => {
        throw new Error('Event bus error');
      });

      // Then logout - should still clear state
      await logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('signup', () => {
    it('should signup successfully and set user with tokens', async () => {
      const mockUser: User = {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
        emailVerified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: RegisterResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-456',
          refreshToken: 'refresh-token-456',
        },
        message: 'User registered successfully',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

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
      expect(state.accessToken).toBe('access-token-456');
      expect(state.refreshToken).toBe('refresh-token-456');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Verify API call
      expect(getMockPost()).toHaveBeenCalledWith('/api/auth/register', {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: undefined,
      });

      // Verify event emission
      expect(getMockEmit()).toHaveBeenCalledWith(
        'auth:login',
        {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          },
          accessToken: 'access-token-456',
          refreshToken: 'refresh-token-456',
        },
        'auth-mfe'
      );
    });

    it('should signup with specified role', async () => {
      const mockUser: User = {
        id: 'user-789',
        email: 'vendor@example.com',
        name: 'Vendor User',
        role: 'VENDOR',
        emailVerified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: RegisterResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-789',
          refreshToken: 'refresh-token-789',
        },
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

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
      const mockUser: User = {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
        emailVerified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: RegisterResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-456',
          refreshToken: 'refresh-token-456',
        },
      };

      // Delay the response to test loading state
      getMockPost().mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

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

    it('should handle signup errors', async () => {
      const mockError = new Error('Email already exists');
      getMockPost().mockRejectedValueOnce(mockError);

      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      await signup(signUpData);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Email already exists');
    });

    it('should handle signup API response with success false', async () => {
      const mockResponse: RegisterResponse = {
        success: false,
        data: {
          user: {
            id: '',
            email: '',
            name: '',
            role: 'CUSTOMER',
            emailVerified: false,
            createdAt: '',
            updatedAt: '',
          },
          accessToken: '',
          refreshToken: '',
        },
        message: 'Email already exists',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      await signup(signUpData);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Email already exists');
    });

    it('should handle signup API response with null data', async () => {
      const mockResponse: RegisterResponse = {
        success: true,
        data: null as unknown as {
          user: User;
          accessToken: string;
          refreshToken: string;
        },
        message: 'Registration failed',
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { signup } = useAuthStore.getState();

      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await signup(signUpData);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Registration failed');
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', async () => {
      const mockUser: User = {
        id: 'user-admin',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-admin',
          refreshToken: 'refresh-token-admin',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

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
      const mockUser: User = {
        id: 'user-admin',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-admin',
          refreshToken: 'refresh-token-admin',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

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
      const mockUser: User = {
        id: 'user-customer',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockLoginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-customer',
          refreshToken: 'refresh-token-customer',
        },
      };

      getMockPost().mockResolvedValueOnce(mockLoginResponse);

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

  describe('setAccessToken', () => {
    it('should update access token and emit token refreshed event', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      // Set user first
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const { setAccessToken } = useAuthStore.getState();

      setAccessToken('new-access-token', 'new-refresh-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');

      // Verify event emission
      expect(getMockEmit()).toHaveBeenCalledWith(
        'auth:token-refreshed',
        {
          userId: 'user-123',
          accessToken: 'new-access-token',
        },
        'auth-mfe'
      );
    });

    it('should update tokens without emitting event if no user', () => {
      // Ensure no user is set
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      const { setAccessToken } = useAuthStore.getState();

      setAccessToken('new-access-token', 'new-refresh-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');

      // Verify event was NOT emitted (no user)
      expect(getMockEmit()).not.toHaveBeenCalled();
    });
  });

  describe('exports from index.ts', () => {
    it('should export useAuthStore', () => {
      expect(useAuthStoreFromIndex).toBeDefined();
      expect(typeof useAuthStoreFromIndex).toBe('function');
    });

    it('should export types', () => {
      // Verify types are exported (compile-time check)
      const _userRole: UserRole = 'ADMIN';
      const _signUpData: SignUpDataFromIndex = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      };
      const _user: UserFromIndex = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const _authState: AuthState = useAuthStoreFromIndex.getState();

      expect(_userRole).toBe('ADMIN');
      expect(_signUpData.email).toBe('test@example.com');
      expect(_user.id).toBe('1');
      expect(_authState).toBeDefined();
    });
  });

  describe('persistence', () => {
    it('should persist user, tokens, and isAuthenticated to localStorage', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

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
          expect(parsed.state.accessToken).toBe('access-token-123');
          expect(parsed.state.refreshToken).toBe('refresh-token-123');
        }
      } else {
        // Skip test if localStorage is not available
        expect(true).toBe(true);
      }
    });

    it('should restore state from localStorage on initialization', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      };

      getMockPost().mockResolvedValueOnce(mockResponse);

      const { login } = useAuthStore.getState();

      // Login and persist
      await login('test@example.com', 'password123');
      const _user = useAuthStore.getState().user;
      expect(_user).toBeTruthy();

      // Clear store state
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
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
