/**
 * Device Service
 *
 * Business logic for device registration and management
 * Supports cross-device session synchronization
 */

import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { getEventPublisher } from '../events/publisher';

/**
 * Device information for registration
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: 'browser' | 'mobile' | 'desktop';
  userAgent?: string;
}

/**
 * Device response (without sensitive data)
 */
export interface DeviceResponse {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
}

/**
 * Register or update a device for a user
 *
 * @param userId - User ID
 * @param deviceInfo - Device information
 * @returns Device record
 */
export const registerDevice = async (
  userId: string,
  deviceInfo: DeviceInfo
): Promise<DeviceResponse> => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Upsert device (create if new, update if exists)
  const device = await prisma.device.upsert({
    where: { deviceId: deviceInfo.deviceId },
    update: {
      lastActiveAt: new Date(),
      userAgent: deviceInfo.userAgent,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
    },
    create: {
      userId,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      userAgent: deviceInfo.userAgent,
    },
  });

  return {
    id: device.id,
    userId: device.userId,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    userAgent: device.userAgent,
    lastActiveAt: device.lastActiveAt,
    createdAt: device.createdAt,
  };
};

/**
 * Get all devices for a user
 *
 * @param userId - User ID
 * @returns Array of device records
 */
export const getUserDevices = async (
  userId: string
): Promise<DeviceResponse[]> => {
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastActiveAt: 'desc' },
  });

  type DeviceType = Awaited<ReturnType<typeof prisma.device.findMany>>[number];

  return devices.map((device: DeviceType): DeviceResponse => {
    return {
      id: device.id,
      userId: device.userId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      userAgent: device.userAgent,
      lastActiveAt: device.lastActiveAt,
      createdAt: device.createdAt,
    };
  });
};

/**
 * Logout a specific device
 *
 * @param userId - User ID
 * @param deviceId - Device ID to logout
 * @throws ApiError if device not found or doesn't belong to user
 */
export const logoutDevice = async (
  userId: string,
  deviceId: string
): Promise<void> => {
  // Verify device exists and belongs to user
  const device = await prisma.device.findFirst({
    where: {
      deviceId,
      userId,
    },
  });

  if (!device) {
    throw new ApiError(
      404,
      'DEVICE_NOT_FOUND',
      'Device not found or does not belong to user'
    );
  }

  // Delete device
  await prisma.device.delete({
    where: { id: device.id },
  });

  // Publish event for WebSocket notification
  const publisher = getEventPublisher();
  await publisher.publish(
    'auth.session.revoked',
    {
      userId,
      deviceId,
      timestamp: new Date().toISOString(),
    },
    {
      userId,
      eventType: 'session_management',
    }
  );

  console.log(
    `[Device Service] Device logged out: ${deviceId} for user: ${userId}`
  );
};

/**
 * Logout all other devices (keep current device)
 *
 * @param userId - User ID
 * @param currentDeviceId - Current device ID to keep
 * @returns Number of devices logged out
 */
export const logoutOtherDevices = async (
  userId: string,
  currentDeviceId: string
): Promise<number> => {
  // Get all other devices
  const devices = await prisma.device.findMany({
    where: {
      userId,
      deviceId: { not: currentDeviceId },
    },
  });

  if (devices.length === 0) {
    return 0;
  }

  // Delete all other devices
  await prisma.device.deleteMany({
    where: {
      userId,
      deviceId: { not: currentDeviceId },
    },
  });

  // Publish events for WebSocket notification
  const publisher = getEventPublisher();
  for (const device of devices) {
    await publisher.publish(
      'auth.session.revoked',
      {
        userId,
        deviceId: device.deviceId,
        timestamp: new Date().toISOString(),
      },
      {
        userId,
        eventType: 'session_management',
      }
    );
  }

  console.log(
    `[Device Service] Logged out ${devices.length} other devices for user: ${userId}`
  );

  return devices.length;
};
