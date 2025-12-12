/**
 * Audit Logs API Tests
 */

import { apiClient } from '@mfe/shared-api-client';
import { getAuditLogs, getAvailableActions } from './audit-logs';

// Mock the API client
jest.mock('@mfe/shared-api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
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

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs();

      expect(apiClient.get).toHaveBeenCalledWith('/admin/audit-logs?');
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

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs({
        page: 2,
        limit: 50,
        userId: 'user-123',
        action: 'USER_LOGIN',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
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

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getAuditLogs({
        action: 'PAYMENT_CREATED',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/audit-logs?action=PAYMENT_CREATED'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getAuditLogs()).rejects.toThrow('Network error');
    });

    it('should handle backend not implemented error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(
        new Error('Audit logging not yet implemented')
      );

      await expect(getAuditLogs()).rejects.toThrow(
        'Audit logging not yet implemented'
      );
    });
  });

  describe('getAvailableActions', () => {
    it('should return list of available actions', () => {
      const actions = getAvailableActions();

      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should include user actions', () => {
      const actions = getAvailableActions();

      expect(actions).toContain('USER_LOGIN');
      expect(actions).toContain('USER_LOGOUT');
      expect(actions).toContain('USER_CREATED');
      expect(actions).toContain('USER_UPDATED');
      expect(actions).toContain('USER_DELETED');
      expect(actions).toContain('USER_ROLE_CHANGED');
    });

    it('should include payment actions', () => {
      const actions = getAvailableActions();

      expect(actions).toContain('PAYMENT_CREATED');
      expect(actions).toContain('PAYMENT_UPDATED');
      expect(actions).toContain('PAYMENT_COMPLETED');
      expect(actions).toContain('PAYMENT_FAILED');
      expect(actions).toContain('PAYMENT_CANCELLED');
    });

    it('should include system actions', () => {
      const actions = getAvailableActions();

      expect(actions).toContain('SYSTEM_CONFIG_CHANGED');
      expect(actions).toContain('ADMIN_ACTION');
    });

    it('should return consistent results', () => {
      const actions1 = getAvailableActions();
      const actions2 = getAvailableActions();

      expect(actions1).toEqual(actions2);
    });
  });
});
