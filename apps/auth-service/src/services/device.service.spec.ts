/**
 * Device Service Tests
 */

import {
  registerDevice,
  getUserDevices,
  logoutDevice,
  logoutOtherDevices,
} from './device.service';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { getEventPublisher } from '../events/publisher';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    device: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockPublish = jest.fn().mockResolvedValue(undefined);
const mockEventPublisherInstance = {
  publish: mockPublish,
};

jest.mock('../events/publisher', () => ({
  getEventPublisher: jest.fn(() => mockEventPublisherInstance),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Device Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPublish.mockClear();
  });

  describe('registerDevice', () => {
    const userId = 'user-1';
    const deviceInfo = {
      deviceId: 'device-1',
      deviceName: 'My Device',
      deviceType: 'browser' as const,
      userAgent: 'Mozilla/5.0',
    };

    it('should register a new device', async () => {
      const mockUser = { id: userId, email: 'test@example.com' };
      const mockDevice = {
        id: 'device-record-1',
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        userAgent: deviceInfo.userAgent,
        lastActiveAt: new Date(),
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);
      mockPrisma.device.upsert.mockResolvedValue(mockDevice as never);

      const result = await registerDevice(userId, deviceInfo);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.device.upsert).toHaveBeenCalledWith({
        where: { deviceId: deviceInfo.deviceId },
        update: {
          lastActiveAt: expect.any(Date),
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
      expect(result).toEqual({
        id: mockDevice.id,
        userId: mockDevice.userId,
        deviceId: mockDevice.deviceId,
        deviceName: mockDevice.deviceName,
        deviceType: mockDevice.deviceType,
        userAgent: mockDevice.userAgent,
        lastActiveAt: mockDevice.lastActiveAt,
        createdAt: mockDevice.createdAt,
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(registerDevice(userId, deviceInfo)).rejects.toThrow(
        ApiError
      );
      await expect(registerDevice(userId, deviceInfo)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getUserDevices', () => {
    const userId = 'user-1';

    it('should return all devices for a user', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          userId,
          deviceId: 'device-id-1',
          deviceName: 'Device 1',
          deviceType: 'browser',
          userAgent: 'Mozilla/5.0',
          lastActiveAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'device-2',
          userId,
          deviceId: 'device-id-2',
          deviceName: 'Device 2',
          deviceType: 'mobile',
          userAgent: 'Mobile/1.0',
          lastActiveAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.device.findMany.mockResolvedValue(mockDevices as never);

      const result = await getUserDevices(userId);

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { lastActiveAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockDevices[0].id,
        userId: mockDevices[0].userId,
        deviceId: mockDevices[0].deviceId,
        deviceName: mockDevices[0].deviceName,
        deviceType: mockDevices[0].deviceType,
        userAgent: mockDevices[0].userAgent,
        lastActiveAt: mockDevices[0].lastActiveAt,
        createdAt: mockDevices[0].createdAt,
      });
    });

    it('should return empty array if user has no devices', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      const result = await getUserDevices(userId);

      expect(result).toEqual([]);
    });
  });

  describe('logoutDevice', () => {
    const userId = 'user-1';
    const deviceId = 'device-id-1';

    it('should logout a specific device', async () => {
      const mockDevice = {
        id: 'device-record-1',
        userId,
        deviceId,
        deviceName: 'Device 1',
        deviceType: 'browser',
        userAgent: 'Mozilla/5.0',
        lastActiveAt: new Date(),
        createdAt: new Date(),
      };

      mockPrisma.device.findFirst.mockResolvedValue(mockDevice as never);
      mockPrisma.device.delete.mockResolvedValue(mockDevice as never);

      await logoutDevice(userId, deviceId);

      expect(mockPrisma.device.findFirst).toHaveBeenCalledWith({
        where: { deviceId, userId },
      });
      expect(mockPrisma.device.delete).toHaveBeenCalledWith({
        where: { id: mockDevice.id },
      });
      expect(mockPublish).toHaveBeenCalledWith(
        'auth.session.revoked',
        {
          userId,
          deviceId,
          timestamp: expect.any(String),
        },
        {
          userId,
          eventType: 'session_management',
        }
      );
    });

    it('should throw error if device not found', async () => {
      mockPrisma.device.findFirst.mockResolvedValue(null);

      await expect(logoutDevice(userId, deviceId)).rejects.toThrow(ApiError);
      await expect(logoutDevice(userId, deviceId)).rejects.toThrow(
        'Device not found or does not belong to user'
      );
    });
  });

  describe('logoutOtherDevices', () => {
    const userId = 'user-1';
    const currentDeviceId = 'device-id-1';

    it('should logout all other devices', async () => {
      const mockDevices = [
        {
          id: 'device-2',
          userId,
          deviceId: 'device-id-2',
          deviceName: 'Device 2',
          deviceType: 'mobile',
          userAgent: 'Mobile/1.0',
          lastActiveAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: 'device-3',
          userId,
          deviceId: 'device-id-3',
          deviceName: 'Device 3',
          deviceType: 'desktop',
          userAgent: 'Desktop/1.0',
          lastActiveAt: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrisma.device.findMany.mockResolvedValue(mockDevices as never);
      mockPrisma.device.deleteMany.mockResolvedValue({ count: 2 } as never);

      const count = await logoutOtherDevices(userId, currentDeviceId);

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deviceId: { not: currentDeviceId },
        },
      });
      expect(mockPrisma.device.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          deviceId: { not: currentDeviceId },
        },
      });
      expect(count).toBe(2);
      expect(mockPublish).toHaveBeenCalledTimes(2);
    });

    it('should return 0 if no other devices exist', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      const count = await logoutOtherDevices(userId, currentDeviceId);

      expect(count).toBe(0);
      expect(mockPrisma.device.deleteMany).not.toHaveBeenCalled();
      expect(mockPublish).not.toHaveBeenCalled();
    });
  });
});
