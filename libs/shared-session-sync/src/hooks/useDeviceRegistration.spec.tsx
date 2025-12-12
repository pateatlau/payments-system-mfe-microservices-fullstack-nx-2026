/**
 * Device Registration Hooks Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDeviceRegistration,
  useUserDevices,
  useLogoutDevice,
  useLogoutOtherDevices,
} from './useDeviceRegistration';
import { getApiClient } from '@mfe/shared-api-client';
import { getDeviceId } from '../lib/device-id';

// Mock API client
jest.mock('@mfe/shared-api-client', () => ({
  getApiClient: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock device ID
jest.mock('../lib/device-id', () => ({
  getDeviceId: jest.fn(() => 'test-device-id'),
  getDeviceName: jest.fn(() => 'Test Browser'),
  getDeviceType: jest.fn(() => 'browser' as const),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDeviceRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register device on mount', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'device-1', deviceId: 'test-device-id' },
    });

    (getApiClient as jest.Mock).mockReturnValue({
      post: mockPost,
    });

    const { result } = renderHook(() => useDeviceRegistration(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isRegistering).toBe(false);
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/devices/register', {
      deviceId: 'test-device-id',
      deviceName: 'Test Browser',
      deviceType: 'browser',
    });
  });

  it('should not register if disabled', () => {
    const mockPost = jest.fn();

    (getApiClient as jest.Mock).mockReturnValue({
      post: mockPost,
    });

    renderHook(() => useDeviceRegistration(false), {
      wrapper: createWrapper(),
    });

    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('useUserDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user devices', async () => {
    const mockDevices = [
      {
        id: 'device-1',
        deviceId: 'test-device-id',
        deviceName: 'Test Browser',
        lastActiveAt: new Date().toISOString(),
      },
    ];

    const mockGet = jest.fn().mockResolvedValue({
      success: true,
      data: mockDevices,
    });

    (getApiClient as jest.Mock).mockReturnValue({
      get: mockGet,
    });

    const { result } = renderHook(() => useUserDevices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGet).toHaveBeenCalledWith('/auth/devices');
    expect(result.current.data).toEqual(mockDevices);
  });
});

describe('useLogoutDevice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout device', async () => {
    const mockDelete = jest.fn().mockResolvedValue({
      success: true,
    });

    (getApiClient as jest.Mock).mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useLogoutDevice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('device-id-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith('/auth/devices/device-id-1');
  });
});

describe('useLogoutOtherDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout other devices', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      success: true,
      data: { loggedOutCount: 2 },
    });

    (getApiClient as jest.Mock).mockReturnValue({
      post: mockPost,
    });

    const { result } = renderHook(() => useLogoutOtherDevices(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/devices/logout-others', {
      currentDeviceId: 'test-device-id',
    });
  });
});
