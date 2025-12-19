/**
 * Profile API client tests
 *
 * Verifies that the profile API wrapper functions correctly handle
 * successful responses and error scenarios for all four endpoints:
 * - getProfile
 * - updateProfile
 * - getPreferences
 * - updatePreferences
 */

import { ApiClient } from '@mfe/shared-api-client';
import {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
} from './profile';
import type {
  Profile,
  UpdateProfileData,
  UserPreferences,
  UpdatePreferencesData,
} from '../types/profile';

/**
 * Reset all spies/mocks between tests to avoid cross-test interference.
 */
afterEach(() => {
  jest.restoreAllMocks();
});

describe('profile API client', () => {
  describe('getProfile', () => {
    it('returns profile data on success', async () => {
      const mockProfile: Profile = {
        id: 'profile-1',
        userId: 'user-1',
        phone: '1234567890',
        address: '123 Test Street',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'Test bio',
        preferences: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      const getSpy = jest
        .spyOn(ApiClient.prototype, 'get')
        .mockResolvedValue({ success: true, data: mockProfile } as never);

      const result = await getProfile();

      expect(getSpy).toHaveBeenCalledWith('/profile');
      expect(result).toEqual(mockProfile);
    });

    it('propagates errors from the underlying client', async () => {
      const error = new Error('Network error');

      jest.spyOn(ApiClient.prototype, 'get').mockRejectedValue(error);

      await expect(getProfile()).rejects.toThrow(error);
    });
  });

  describe('updateProfile', () => {
    it('returns updated profile on success', async () => {
      const payload: UpdateProfileData = {
        phoneNumber: '0987654321',
        address: '456 Updated Street',
        avatarUrl: 'https://example.com/new-avatar.png',
        bio: 'Updated bio',
      };

      const mockProfile: Profile = {
        id: 'profile-1',
        userId: 'user-1',
        phone: '0987654321',
        address: '456 Updated Street',
        avatarUrl: 'https://example.com/new-avatar.png',
        bio: 'Updated bio',
        preferences: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-03T00:00:00.000Z',
      };

      const putSpy = jest
        .spyOn(ApiClient.prototype, 'put')
        .mockResolvedValue({ success: true, data: mockProfile } as never);

      const result = await updateProfile(payload);

      expect(putSpy).toHaveBeenCalledWith('/profile', payload);
      expect(result).toEqual(mockProfile);
    });

    it('propagates errors from the underlying client', async () => {
      const error = new Error('Update failed');

      jest.spyOn(ApiClient.prototype, 'put').mockRejectedValue(error);

      await expect(updateProfile({ address: 'New address' })).rejects.toThrow(
        error
      );
    });
  });

  describe('getPreferences', () => {
    it('returns preferences on success', async () => {
      const mockPreferences: UserPreferences = {
        theme: 'dark',
        language: 'en',
        currency: 'USD',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
      };

      const getSpy = jest
        .spyOn(ApiClient.prototype, 'get')
        .mockResolvedValue({ success: true, data: mockPreferences } as never);

      const result = await getPreferences();

      expect(getSpy).toHaveBeenCalledWith('/profile/preferences');
      expect(result).toEqual(mockPreferences);
    });

    it('propagates errors from the underlying client', async () => {
      const error = new Error('Preferences fetch failed');

      jest.spyOn(ApiClient.prototype, 'get').mockRejectedValue(error);

      await expect(getPreferences()).rejects.toThrow(error);
    });
  });

  describe('updatePreferences', () => {
    it('returns updated preferences on success', async () => {
      const payload: UpdatePreferencesData = {
        theme: 'light',
        language: 'en-US',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      };

      const mockPreferences: UserPreferences = {
        theme: 'light',
        language: 'en-US',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      };

      const putSpy = jest
        .spyOn(ApiClient.prototype, 'put')
        .mockResolvedValue({ success: true, data: mockPreferences } as never);

      const result = await updatePreferences(payload);

      expect(putSpy).toHaveBeenCalledWith('/profile/preferences', payload);
      expect(result).toEqual(mockPreferences);
    });

    it('propagates errors from the underlying client', async () => {
      const error = new Error('Update preferences failed');

      jest.spyOn(ApiClient.prototype, 'put').mockRejectedValue(error);

      await expect(updatePreferences({ theme: 'dark' })).rejects.toThrow(error);
    });
  });
});
