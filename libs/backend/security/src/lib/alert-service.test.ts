/**
 * Alert Service Tests
 */

import { AlertService, EmailService } from './alert-service';
import type { Anomaly, SecurityAlert, UserNotification } from './types';
import type Redis from 'ioredis';

// Mock Redis type for testing
type MockRedis = {
  get: jest.Mock;
  set: jest.Mock;
  lpush: jest.Mock;
  ltrim: jest.Mock;
  lrange: jest.Mock;
  lindex: jest.Mock;
  lset: jest.Mock;
  expire: jest.Mock;
  exists: jest.Mock;
};

const createMockRedis = (): MockRedis => ({
  get: jest.fn(),
  set: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  lrange: jest.fn(),
  lindex: jest.fn(),
  lset: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
});

// Mock fetch
global.fetch = jest.fn();

describe('AlertService', () => {
  let alertService: AlertService;
  let mockRedis: MockRedis;
  let mockEmailService: EmailService;

  beforeEach(() => {
    mockRedis = createMockRedis();
    mockEmailService = { sendEmail: jest.fn() };
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    alertService = new AlertService(
      mockRedis as unknown as Redis,
      {
        enableSlack: true,
        slackWebhookUrl: 'https://hooks.slack.test/webhook',
        enableEmail: true,
        adminEmails: ['admin@example.com'],
        riskThreshold: 70,
        userNotificationThreshold: 50,
      },
      mockEmailService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create admin alert for high risk anomaly', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          riskScore: 50,
          description: 'Impossible travel detected',
          details: { distance: 10000 },
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const alert = await alertService.createAlert(
        'user-123',
        'LOGIN',
        anomalies,
        75
      );

      expect(alert).not.toBeNull();
      expect(alert?.userId).toBe('user-123');
      expect(alert?.eventType).toBe('LOGIN');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should not create alert below risk threshold', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'NEW_CITY',
          severity: 'LOW',
          riskScore: 10,
          description: 'Login from new city',
          details: {},
          timestamp: new Date(),
        },
      ];

      const alert = await alertService.createAlert(
        'user-123',
        'LOGIN',
        anomalies,
        30 // Below threshold
      );

      expect(alert).toBeNull();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should deduplicate alerts', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'NEW_COUNTRY',
          severity: 'HIGH',
          riskScore: 30,
          description: 'Login from new country',
          details: {},
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(1); // Already exists

      const alert = await alertService.createAlert(
        'user-123',
        'LOGIN',
        anomalies,
        75
      );

      expect(alert).toBeNull();
      expect(mockRedis.lpush).not.toHaveBeenCalled();
    });
  });

  describe('createUserNotification', () => {
    it('should create user notification for high risk anomaly', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'NEW_COUNTRY',
          severity: 'HIGH',
          riskScore: 30,
          description: 'Login from new country: Germany',
          details: { newCountry: 'DE' },
          timestamp: new Date(),
        },
      ];

      const notification = await alertService.createUserNotification(
        'user-123',
        'NEW_LOGIN',
        anomalies,
        55
      );

      expect(notification).not.toBeNull();
      expect(notification?.userId).toBe('user-123');
      expect(notification?.type).toBe('NEW_LOGIN');
      expect(mockRedis.lpush).toHaveBeenCalled();
    });

    it('should not create notification below threshold', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'UNUSUAL_TIME',
          severity: 'MEDIUM',
          riskScore: 15,
          description: 'Login at unusual time',
          details: {},
          timestamp: new Date(),
        },
      ];

      const notification = await alertService.createUserNotification(
        'user-123',
        'UNUSUAL_ACTIVITY',
        anomalies,
        30 // Below threshold
      );

      expect(notification).toBeNull();
    });

    it('should create security alert notification type', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          riskScore: 50,
          description: 'Impossible travel detected',
          details: {},
          timestamp: new Date(),
        },
      ];

      const notification = await alertService.createUserNotification(
        'user-123',
        'SECURITY_ALERT',
        anomalies,
        80
      );

      expect(notification?.title).toBe('Security Alert');
      expect(notification?.actionRequired).toBe(true);
    });
  });

  describe('getUserAlerts', () => {
    it('should get all alerts for user', async () => {
      const alertId = 'alert-1';
      const alert: SecurityAlert = {
        id: alertId,
        userId: 'user-123',
        eventType: 'LOGIN',
        anomalies: [],
        totalRiskScore: 75,
        timestamp: new Date(),
        acknowledged: false,
      };

      mockRedis.lrange.mockResolvedValue([alertId]);
      mockRedis.get.mockResolvedValue(JSON.stringify(alert));

      const result = await alertService.getUserAlerts('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(alertId);
    });

    it('should return empty array when no alerts', async () => {
      mockRedis.lrange.mockResolvedValue([]);

      const result = await alertService.getUserAlerts('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when Redis is not available', async () => {
      const serviceNoRedis = new AlertService(null);

      const result = await serviceNoRedis.getUserAlerts('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const alert: SecurityAlert = {
        id: 'alert-1',
        userId: 'user-123',
        eventType: 'LOGIN',
        anomalies: [],
        totalRiskScore: 75,
        timestamp: new Date(),
        acknowledged: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(alert));
      mockRedis.set.mockResolvedValue('OK');

      const result = await alertService.acknowledgeAlert('alert-1', 'admin-user');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return false when alert not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await alertService.acknowledgeAlert('non-existent', 'admin-user');

      expect(result).toBe(false);
    });

    it('should return false when Redis is not available', async () => {
      const serviceNoRedis = new AlertService(null);

      const result = await serviceNoRedis.acknowledgeAlert('alert-1', 'admin-user');

      expect(result).toBe(false);
    });
  });

  describe('getUserNotifications', () => {
    it('should get all notifications for user', async () => {
      const notification: UserNotification = {
        userId: 'user-123',
        type: 'SECURITY_ALERT',
        title: 'Security Alert',
        message: 'Suspicious activity detected',
        severity: 'HIGH',
        timestamp: new Date(),
      };

      mockRedis.lrange.mockResolvedValue([JSON.stringify(notification)]);

      const result = await alertService.getUserNotifications('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
    });

    it('should return empty array when Redis is not available', async () => {
      const serviceNoRedis = new AlertService(null);

      const result = await serviceNoRedis.getUserNotifications('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('Slack notifications', () => {
    it('should send Slack notification for critical alert', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          riskScore: 50,
          description: 'Impossible travel detected',
          details: {},
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      await alertService.createAlert('user-123', 'LOGIN', anomalies, 90);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.test/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should not send Slack when not configured', async () => {
      const serviceNoSlack = new AlertService(mockRedis as unknown as Redis, {
        enableSlack: false,
        riskThreshold: 70,
        userNotificationThreshold: 50,
      });

      const anomalies: Anomaly[] = [
        {
          type: 'NEW_COUNTRY',
          severity: 'HIGH',
          riskScore: 30,
          description: 'New country login',
          details: {},
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);

      await serviceNoSlack.createAlert('user-123', 'LOGIN', anomalies, 75);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle Slack API errors gracefully', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'NEW_COUNTRY',
          severity: 'HIGH',
          riskScore: 30,
          description: 'New country login',
          details: {},
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Should not throw
      const result = await alertService.createAlert(
        'user-123',
        'LOGIN',
        anomalies,
        75
      );

      expect(result).not.toBeNull();
    });
  });

  describe('Email notifications', () => {
    it('should send email for critical alert', async () => {
      const anomalies: Anomaly[] = [
        {
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          riskScore: 50,
          description: 'Impossible travel detected',
          details: { distance: 10000 },
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      await alertService.createAlert('user-123', 'LOGIN', anomalies, 90);

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.stringContaining('Security Alert'),
        expect.stringContaining('user-123')
      );
    });

    it('should not send email when not configured', async () => {
      const serviceNoEmail = new AlertService(mockRedis as unknown as Redis, {
        enableEmail: false,
        riskThreshold: 70,
        userNotificationThreshold: 50,
      });

      const anomalies: Anomaly[] = [
        {
          type: 'NEW_COUNTRY',
          severity: 'HIGH',
          riskScore: 30,
          description: 'New country login',
          details: {},
          timestamp: new Date(),
        },
      ];

      mockRedis.exists.mockResolvedValue(0);

      await serviceNoEmail.createAlert('user-123', 'LOGIN', anomalies, 75);

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('default configuration', () => {
    it('should use default config when not provided', () => {
      const serviceDefault = new AlertService(mockRedis as unknown as Redis);

      // Should not throw
      expect(serviceDefault).toBeDefined();
    });
  });
});
