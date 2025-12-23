/**
 * Device Session Sync Hook
 *
 * Listens for device logout events via WebSocket and automatically
 * logs out the user if their current device is logged out remotely.
 */

import { useWebSocketSubscription } from 'shared-websocket';
import { useAuthStore } from 'shared-auth-store';
import { getDeviceId } from '../lib/device-id';

/**
 * Hook to sync device logout events via WebSocket
 *
 * Listens for `auth.session.revoked` events and automatically logs out
 * the user if their current device was logged out remotely.
 *
 * @param onLogout - Optional callback when device is logged out remotely
 */
export function useDeviceSessionSync(onLogout?: () => void): void {
  const logout = useAuthStore(state => state.logout);
  const currentDeviceId = getDeviceId();

  useWebSocketSubscription(
    'auth.session.revoked',
    (payload: { deviceId: string; userId?: string; timestamp?: string }) => {
      if (payload.deviceId === currentDeviceId) {
        // This device was logged out remotely
        console.log('[Device Sync] Device logged out remotely', {
          deviceId: payload.deviceId,
          timestamp: payload.timestamp,
        });

        // Call optional callback
        if (onLogout) {
          onLogout();
        }

        // Logout user
        logout();
      }
    }
  );

  // No cleanup needed - useWebSocketSubscription handles it
}
