/**
 * System Health Controller Tests
 */

import { Request, Response } from 'express';
import { getSystemHealth } from './system-health.controller';
import { prisma } from '../lib/prisma';

// Mock dependencies
jest.mock('db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('System Health Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();

    // Mock successful service responses by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    // Mock successful database check
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
  });

  describe('getSystemHealth', () => {
    it('should return degraded status when all services are up (Redis unknown)', async () => {
      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'degraded', // Degraded because Redis is 'unknown'
            timestamp: expect.any(String),
            services: {
              database: 'healthy',
              redis: 'unknown',
              authService: 'healthy',
              paymentsService: 'healthy',
              adminService: 'healthy',
              profileService: 'healthy',
            },
            version: '1.0.0',
            uptime: expect.any(Number),
            responseTime: expect.any(Number),
          }),
        })
      );
    });

    it('should return degraded status when some services are down', async () => {
      // Mock one service failing
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Auth
        .mockResolvedValueOnce({ ok: false, status: 503 }) // Payments (down)
        .mockResolvedValueOnce({ ok: true, status: 200 }); // Profile

      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'degraded',
            services: expect.objectContaining({
              paymentsService: 'unhealthy',
            }),
          }),
        })
      );
    });

    it('should return unhealthy status when multiple services are down', async () => {
      // Mock multiple services failing
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503 }) // Auth (down)
        .mockResolvedValueOnce({ ok: false, status: 503 }) // Payments (down)
        .mockResolvedValueOnce({ ok: false, status: 503 }); // Profile (down)

      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'unhealthy',
            services: {
              database: 'healthy',
              redis: 'unknown',
              authService: 'unhealthy',
              paymentsService: 'unhealthy',
              adminService: 'healthy',
              profileService: 'unhealthy',
            },
          }),
        })
      );
    });

    it('should handle database connection failure', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            services: expect.objectContaining({
              database: 'unhealthy',
            }),
          }),
        })
      );
    });

    it('should handle service timeout', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'unhealthy',
            services: {
              database: 'healthy',
              redis: 'unknown',
              authService: 'unhealthy',
              paymentsService: 'unhealthy',
              adminService: 'healthy',
              profileService: 'unhealthy',
            },
          }),
        })
      );
    });

    it('should include response time in the response', async () => {
      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            responseTime: expect.any(Number),
          }),
        })
      );
    });

    it('should include process uptime', async () => {
      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            uptime: expect.any(Number),
          }),
        })
      );
    });

    it('should handle database check errors as unhealthy', async () => {
      // Mock a database failure (but don't crash the whole check)
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Catastrophic failure')
      );

      await getSystemHealth(mockRequest as Request, mockResponse as Response);

      // Should return degraded status with database unhealthy
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'degraded',
            services: expect.objectContaining({
              database: 'unhealthy',
            }),
          }),
        })
      );
    });
  });
});
