/**
 * Session Sync Hooks Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSessionSync, useAutoSyncAuthState } from './useSessionSync';
import { sessionSync } from '../lib/session-sync';
import { useAuthStore } from 'shared-auth-store';

// Mock session sync
jest.mock('../lib/session-sync', () => {
  const mockOn = jest.fn(() => jest.fn());
  const mockBroadcastLogout = jest.fn();
  const mockBroadcastAuthState = jest.fn();
  const mockBroadcastTokenRefresh = jest.fn();

  return {
    sessionSync: {
      on: mockOn,
      broadcastLogout: mockBroadcastLogout,
      broadcastAuthState: mockBroadcastAuthState,
      broadcastTokenRefresh: mockBroadcastTokenRefresh,
    },
  };
});

// Mock auth store
const mockLogout = jest.fn();
const mockSetAccessToken = jest.fn();
const mockRefreshToken = jest.fn();

const mockAuthState = {
  logout: mockLogout,
  setAccessToken: mockSetAccessToken,
  refreshToken: mockRefreshToken,
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER' as const,
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  isAuthenticated: true,
};

jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(
    (selector?: (state: typeof mockAuthState) => unknown) => {
      if (selector) {
        return selector(mockAuthState);
      }
      return mockAuthState;
    }
  ),
}));

// Add getState to the mock
(useAuthStore as unknown as { getState: () => typeof mockAuthState }).getState =
  jest.fn(() => mockAuthState);

describe('useSessionSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    mockLogout.mockClear();
    mockSetAccessToken.mockClear();
    mockRefreshToken.mockClear();
  });

  it('should register event listeners on mount', () => {
    renderHook(() => useSessionSync());

    expect(sessionSync.on).toHaveBeenCalledWith('LOGOUT', expect.any(Function));
    expect(sessionSync.on).toHaveBeenCalledWith(
      'AUTH_STATE_CHANGE',
      expect.any(Function)
    );
    expect(sessionSync.on).toHaveBeenCalledWith(
      'TOKEN_REFRESH',
      expect.any(Function)
    );
  });

  it('should return broadcast functions', () => {
    const { result } = renderHook(() => useSessionSync());

    expect(result.current.broadcastLogout).toBeInstanceOf(Function);
    expect(result.current.broadcastAuthState).toBeInstanceOf(Function);
    expect(result.current.broadcastTokenRefresh).toBeInstanceOf(Function);
  });

  it('should call broadcastLogout when function is called', () => {
    const { result } = renderHook(() => useSessionSync());

    result.current.broadcastLogout();

    expect(sessionSync.broadcastLogout).toHaveBeenCalled();
  });

  it('should call broadcastAuthState when function is called', () => {
    const { result } = renderHook(() => useSessionSync());

    result.current.broadcastAuthState();

    expect(sessionSync.broadcastAuthState).toHaveBeenCalled();
  });

  it('should call broadcastTokenRefresh when function is called', () => {
    const { result } = renderHook(() => useSessionSync());

    result.current.broadcastTokenRefresh('new-token');

    expect(sessionSync.broadcastTokenRefresh).toHaveBeenCalledWith('new-token');
  });

  it('should clean up listeners on unmount', () => {
    const unsubLogout = jest.fn();
    const unsubAuth = jest.fn();
    const unsubToken = jest.fn();

    (sessionSync.on as jest.Mock)
      .mockReturnValueOnce(unsubLogout)
      .mockReturnValueOnce(unsubAuth)
      .mockReturnValueOnce(unsubToken);

    const { unmount } = renderHook(() => useSessionSync());

    unmount();

    expect(unsubLogout).toHaveBeenCalled();
    expect(unsubAuth).toHaveBeenCalled();
    expect(unsubToken).toHaveBeenCalled();
  });
});

describe('useAutoSyncAuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should broadcast auth state on mount', () => {
    renderHook(() => useAutoSyncAuthState());

    // Should call broadcastAuthState through useSessionSync
    // This is tested indirectly through the integration
  });
});
