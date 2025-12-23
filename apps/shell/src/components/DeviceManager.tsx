/**
 * Device Manager Component
 *
 * Displays and manages user's active devices.
 * Allows logging out specific devices or all other devices.
 */

import {
  useUserDevices,
  useLogoutDevice,
  useLogoutOtherDevices,
  getDeviceId,
} from 'shared-session-sync';
import { Loading } from '@mfe/shared-design-system';

/**
 * Device Manager Component
 *
 * Shows list of user's active devices with ability to logout specific devices.
 */
export function DeviceManager(): JSX.Element {
  const currentDeviceId = getDeviceId();
  const { data: devices, isLoading, error } = useUserDevices();
  const logoutDevice = useLogoutDevice();
  const logoutOthers = useLogoutOtherDevices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loading size="lg" label="Loading devices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          Failed to load devices. Please try again.
        </p>
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="p-4 bg-muted border border-border rounded-lg">
        <p className="text-muted-foreground">No active devices found.</p>
      </div>
    );
  }

  const otherDevices = devices.filter(
    device => device.deviceId !== currentDeviceId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Active Devices
        </h2>
        {otherDevices.length > 0 && (
          <button
            onClick={() => logoutOthers.mutate()}
            disabled={logoutOthers.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutOthers.isPending
              ? 'Logging out...'
              : 'Logout All Other Devices'}
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {devices.map(device => {
          const isCurrentDevice = device.deviceId === currentDeviceId;
          const isLoggingOut =
            logoutDevice.isPending &&
            logoutDevice.variables === device.deviceId;

          return (
            <li
              key={device.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {device.deviceName || 'Unknown Device'}
                  </p>
                  {isCurrentDevice && (
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      This Device
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {device.deviceType && (
                    <p className="text-sm text-muted-foreground capitalize">
                      {device.deviceType}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Last active:{' '}
                    {new Date(device.lastActiveAt).toLocaleString()}
                  </p>
                  {device.userAgent && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {device.userAgent}
                    </p>
                  )}
                </div>
              </div>
              {!isCurrentDevice && (
                <button
                  onClick={() => logoutDevice.mutate(device.deviceId)}
                  disabled={isLoggingOut || logoutDevice.isPending}
                  className="ml-4 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {devices.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">
          This is your only active device.
        </p>
      )}
    </div>
  );
}
