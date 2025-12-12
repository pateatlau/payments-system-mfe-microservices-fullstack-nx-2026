/**
 * Device Registration Hooks
 *
 * React hooks for device registration and management using TanStack Query.
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@mfe/shared-api-client';
import { getDeviceId, getDeviceName, getDeviceType } from '../lib/device-id';

/**
 * Device registration response
 */
export interface DeviceResponse {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
}

/**
 * Hook to register device on mount
 *
 * Automatically registers the device when the component mounts.
 * Useful for calling once in the app root.
 *
 * @param enabled - Whether to enable registration (default: true)
 */
export function useDeviceRegistration(enabled = true) {
  const deviceId = getDeviceId();
  const apiClient = getApiClient();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<DeviceResponse>(
        '/auth/devices/register',
        {
          deviceId,
          deviceName: getDeviceName(),
          deviceType: getDeviceType(),
        }
      );
      return response.data;
    },
    retry: 2,
  });

  useEffect(() => {
    if (enabled && !registerMutation.isPending && !registerMutation.isSuccess) {
      registerMutation.mutate();
    }
  }, [enabled, registerMutation]);

  return {
    deviceId,
    isRegistering: registerMutation.isPending,
    isRegistered: registerMutation.isSuccess,
    error: registerMutation.error,
  };
}

/**
 * Hook to get all user devices
 *
 * @returns Query result with user's devices
 */
export function useUserDevices() {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await apiClient.get<DeviceResponse[]>('/auth/devices');
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to logout a specific device
 *
 * @returns Mutation for logging out a device
 */
export function useLogoutDevice() {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      await apiClient.delete(`/auth/devices/${deviceId}`);
    },
    onSuccess: () => {
      // Invalidate devices query to refresh list
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

/**
 * Hook to logout all other devices
 *
 * @returns Mutation for logging out other devices
 */
export function useLogoutOtherDevices() {
  const deviceId = getDeviceId();
  const apiClient = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ loggedOutCount: number }>(
        '/auth/devices/logout-others',
        {
          currentDeviceId: deviceId,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate devices query to refresh list
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
