/**
 * Profile Service - Unit Tests
 */

import { profileService } from './profile.service';
import { prisma } from '../lib/prisma';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateProfile', () => {
    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      avatarUrl: null,
      phone: null,
      address: null,
      bio: null,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return existing profile', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );

      const result = await profileService.getOrCreateProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.userProfile.create).not.toHaveBeenCalled();
    });

    it('should create profile if not exists', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await profileService.getOrCreateProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          phone: null,
          address: null,
          avatarUrl: null,
          bio: null,
          preferences: {},
        },
      });
    });
  });

  describe('updateProfile', () => {
    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      avatarUrl: null,
      phone: '+1234567890',
      address: '123 Main St',
      bio: 'Test bio',
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update profile', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({
        ...mockProfile,
        phone: '+9876543210',
      });

      const result = await profileService.updateProfile('user-1', {
        phoneNumber: '+9876543210',
      });

      expect(result.phone).toBe('+9876543210');
      expect(prisma.userProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            phone: '+9876543210',
          }),
        })
      );
    });

    it('should create profile if it does not exist before updating', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userProfile.create as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.userProfile.update as jest.Mock).mockResolvedValue(mockProfile);

      await profileService.updateProfile('user-1', {
        phoneNumber: '+1234567890',
      });

      expect(prisma.userProfile.create).toHaveBeenCalled();
      expect(prisma.userProfile.update).toHaveBeenCalled();
    });
  });

  describe('getPreferences', () => {
    it('should return preferences from profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        preferences: {
          theme: 'dark',
          language: 'en-US',
        },
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );

      const result = await profileService.getPreferences('user-1');

      expect(result).toEqual({
        theme: 'dark',
        language: 'en-US',
      });
    });

    it('should return empty object if no preferences', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        preferences: {},
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );

      const result = await profileService.getPreferences('user-1');

      expect(result).toEqual({});
    });
  });

  describe('updatePreferences', () => {
    it('should merge new preferences with existing ones', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        preferences: {
          theme: 'light',
          language: 'en-US',
        },
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({});

      const result = await profileService.updatePreferences('user-1', {
        theme: 'dark',
        currency: 'USD',
      });

      expect(result).toEqual({
        theme: 'dark',
        language: 'en-US',
        currency: 'USD',
      });

      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          preferences: {
            theme: 'dark',
            language: 'en-US',
            currency: 'USD',
          },
        },
      });
    });

    it('should handle empty existing preferences', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        preferences: {},
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(
        mockProfile
      );
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({});

      const result = await profileService.updatePreferences('user-1', {
        theme: 'dark',
      });

      expect(result).toEqual({
        theme: 'dark',
      });
    });
  });
});
