/**
 * Audit Logs API Tests
 */

import { adminApiClient } from './adminApiClient';
import { getAuditLogs, getAvailableActions } from './audit-logs';

// Mock the admin API client
jest.mock('./adminApiClient', () => ({
  adminApiClient: {
    get: jest.fn(),
  },
  initializeAdminApiClient: jest.fn(),
}));

describe('Audit Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs without filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs();

      expect(adminApiClient.get).toHaveBeenCalledWith('/admin/audit-logs?');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch audit logs with all filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            page: 2,
            limit: 50,
            total: 100,
            totalPages: 2,
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs({
        page: 2,
        limit: 50,
        userId: 'user-123',
        action: 'USER_LOGIN',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(adminApiClient.get).toHaveBeenCalledWith(
        '/admin/audit-logs?page=2&limit=50&userId=user-123&action=USER_LOGIN&startDate=2026-01-01&endDate=2026-01-31'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch audit logs with partial filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 10,
            totalPages: 1,
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs({
        action: 'PAYMENT_CREATED',
      });

      expect(adminApiClient.get).toHaveBeenCalledWith(
        '/admin/audit-logs?action=PAYMENT_CREATED'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getAuditLogs()).rejects.toThrow('Network error');
    });

    it('should handle backend not implemented error', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(
        new Error('Audit logging not yet implemented')
      );

      await expect(getAuditLogs()).rejects.toThrow(
        'Audit logging not yet implemented'
      );
    });
  });

  describe('getAvailableActions', () => {
    it('should return list of available actions', async () => {
      // API returns { data: string[] } - the data property IS the array
      const mockResponse = {
        data: ['USER_LOGIN', 'PAYMENT_CREATED', 'SYSTEM_CONFIG_CHANGED'],
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const actions = await getAvailableActions();

      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should include user actions', async () => {
      const mockResponse = {
        data: ['USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ROLE_CHANGED'],
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const actions = await getAvailableActions();

      expect(actions).toContain('USER_LOGIN');
      expect(actions).toContain('USER_LOGOUT');
      expect(actions).toContain('USER_CREATED');
      expect(actions).toContain('USER_UPDATED');
      expect(actions).toContain('USER_DELETED');
      expect(actions).toContain('USER_ROLE_CHANGED');
    });

    it('should include payment actions', async () => {
      const mockResponse = {
        data: ['PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'],
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const actions = await getAvailableActions();

      expect(actions).toContain('PAYMENT_CREATED');
      expect(actions).toContain('PAYMENT_UPDATED');
      expect(actions).toContain('PAYMENT_COMPLETED');
      expect(actions).toContain('PAYMENT_FAILED');
      expect(actions).toContain('PAYMENT_CANCELLED');
    });

    it('should include system actions', async () => {
      const mockResponse = {
        data: ['SYSTEM_CONFIG_CHANGED', 'ADMIN_ACTION'],
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const actions = await getAvailableActions();

      expect(actions).toContain('SYSTEM_CONFIG_CHANGED');
      expect(actions).toContain('ADMIN_ACTION');
    });

    it('should return empty array on error', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const actions = await getAvailableActions();

      expect(actions).toEqual([]);
    });
  });
});
