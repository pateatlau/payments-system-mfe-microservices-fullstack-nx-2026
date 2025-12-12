/**
 * System Health API Tests
 */

import { adminApiClient } from './adminApiClient';
import {
  getSystemHealth,
  getServiceDisplayName,
  getStatusBadgeVariant,
  getStatusIcon,
} from './system-health';

// Mock the admin API client
jest.mock('./adminApiClient', () => ({
  adminApiClient: {
    get: jest.fn(),
  },
  initializeAdminApiClient: jest.fn(),
}));

describe('System Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemHealth', () => {
    it('should fetch system health data', async () => {
      const mockResponse = {
        data: {
          data: {
            status: 'healthy',
            timestamp: '2026-01-15T10:30:00.000Z',
            services: {
              database: 'healthy',
              redis: 'healthy',
              authService: 'healthy',
              paymentsService: 'healthy',
            },
            version: '1.0.0',
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getSystemHealth();

      expect(adminApiClient.get).toHaveBeenCalledWith('/admin/health');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle API errors', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getSystemHealth()).rejects.toThrow('Network error');
    });

    it('should handle unhealthy services', async () => {
      const mockResponse = {
        data: {
          data: {
            status: 'degraded',
            timestamp: '2026-01-15T10:30:00.000Z',
            services: {
              database: 'healthy',
              redis: 'degraded',
              authService: 'healthy',
              paymentsService: 'unhealthy',
            },
            version: '1.0.0',
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.services.redis).toBe('degraded');
      expect(result.services.paymentsService).toBe('unhealthy');
    });
  });

  describe('getServiceDisplayName', () => {
    it('should return display name for known services', () => {
      expect(getServiceDisplayName('database')).toBe('PostgreSQL Database');
      expect(getServiceDisplayName('redis')).toBe('Redis Cache');
      expect(getServiceDisplayName('authService')).toBe('Auth Service');
      expect(getServiceDisplayName('paymentsService')).toBe('Payments Service');
      expect(getServiceDisplayName('adminService')).toBe('Admin Service');
      expect(getServiceDisplayName('profileService')).toBe('Profile Service');
    });

    it('should return original name for unknown services', () => {
      expect(getServiceDisplayName('unknownService')).toBe('unknownService');
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('should return correct variant for each status', () => {
      expect(getStatusBadgeVariant('healthy')).toBe('success');
      expect(getStatusBadgeVariant('degraded')).toBe('warning');
      expect(getStatusBadgeVariant('unhealthy')).toBe('destructive');
      expect(getStatusBadgeVariant('unknown')).toBe('secondary');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icon for each status', () => {
      expect(getStatusIcon('healthy')).toBe('✅');
      expect(getStatusIcon('degraded')).toBe('⚠️');
      expect(getStatusIcon('unhealthy')).toBe('❌');
      expect(getStatusIcon('unknown')).toBe('❓');
    });
  });
});
