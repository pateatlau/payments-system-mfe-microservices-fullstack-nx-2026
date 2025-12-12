/**
 * Profile Controller - Integration Tests
 */

import type { Request, Response } from 'express';
import {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
} from './profile.controller';
import { profileService } from '../services/profile.service';

// Mock profile service
jest.mock('../services/profile.service');

// Mock Zod validators
jest.mock('../validators/profile.validators', () => ({
  updateProfileSchema: {
    parse: jest.fn(data => data),
  },
  updatePreferencesSchema: {
    parse: jest.fn(data => data),
  },
}));

describe('ProfileController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      },
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        phone: '+1234567890',
        address: '123 Main St',
        user: {},
      };

      (profileService.getOrCreateProfile as jest.Mock).mockResolvedValue(
        mockProfile
      );

      await getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile,
      });
      expect(profileService.getOrCreateProfile).toHaveBeenCalledWith('user-1');
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database error');
      (profileService.getOrCreateProfile as jest.Mock).mockRejectedValue(
        serviceError
      );

      await getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const mockUpdatedProfile = {
        id: 'profile-1',
        userId: 'user-1',
        phone: '+9876543210',
        address: '456 New St',
      };

      (profileService.updateProfile as jest.Mock).mockResolvedValue(
        mockUpdatedProfile
      );

      mockRequest.body = {
        phoneNumber: '+9876543210',
        address: '456 New St',
      };

      await updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedProfile,
      });
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        theme: 'dark',
        language: 'en-US',
        currency: 'USD',
      };

      (profileService.getPreferences as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      await getPreferences(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences,
      });
      expect(profileService.getPreferences).toHaveBeenCalledWith('user-1');
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getPreferences(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      const mockUpdatedPreferences = {
        theme: 'dark',
        language: 'en-US',
        currency: 'USD',
      };

      (profileService.updatePreferences as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      mockRequest.body = {
        theme: 'dark',
        currency: 'USD',
      };

      await updatePreferences(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedPreferences,
      });
      expect(profileService.updatePreferences).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await updatePreferences(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });
});
