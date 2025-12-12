/**
 * Device ID Management
 *
 * Generates and manages device IDs for cross-device session synchronization.
 * Device IDs are stored in localStorage and persist across sessions.
 */

const DEVICE_ID_KEY = 'mfe-device-id';

/**
 * Get or generate device ID
 *
 * Retrieves device ID from localStorage, or generates a new one if not present.
 * Device ID is a UUID v4 that uniquely identifies this browser/device.
 *
 * @returns Device ID string
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a placeholder
    return 'server-device-id';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate new device ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      // Fallback for older browsers
      deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get user-friendly device name
 *
 * Detects browser from user agent and returns a friendly name.
 *
 * @returns Device name string
 */
export function getDeviceName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown Device';
  }

  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    return 'Chrome Browser';
  }
  if (ua.includes('Firefox')) {
    return 'Firefox Browser';
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari Browser';
  }
  if (ua.includes('Edg')) {
    return 'Edge Browser';
  }
  if (ua.includes('Opera') || ua.includes('OPR')) {
    return 'Opera Browser';
  }
  return 'Unknown Browser';
}

/**
 * Get device type
 *
 * Detects device type from user agent.
 *
 * @returns Device type: 'browser', 'mobile', or 'desktop'
 */
export function getDeviceType(): 'browser' | 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') {
    return 'browser';
  }

  const ua = navigator.userAgent;
  if (
    /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  ) {
    return 'mobile';
  }
  // Could add desktop detection, but for now default to browser
  return 'browser';
}

/**
 * Clear device ID from localStorage
 *
 * Useful for testing or when user wants to reset device tracking.
 */
export function clearDeviceId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY);
  }
}
