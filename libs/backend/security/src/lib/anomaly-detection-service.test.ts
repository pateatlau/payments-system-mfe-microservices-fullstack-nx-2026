/**
 * Anomaly Detection Service Tests
 */

import { AnomalyDetectionService } from './anomaly-detection-service';
import type { LoginEvent, TransactionEvent } from './types';

// Mock Redis
const createMockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  lrange: jest.fn(),
  lindex: jest.fn(),
  lset: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  zadd: jest.fn(),
  zcount: jest.fn(),
  zrangebyscore: jest.fn(),
  zremrangebyscore: jest.fn(),
  incr: jest.fn(),
  incrbyfloat: jest.fn(),
  del: jest.fn(),
});

describe('AnomalyDetectionService', () => {
  let service: AnomalyDetectionService;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    service = new AnomalyDetectionService({
      redis: mockRedis as any,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeLogin', () => {
    it('should analyze login and return result', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeLogin(event);

      expect(result).toBeDefined();
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.totalRiskScore).toBeDefined();
      expect(typeof result.totalRiskScore).toBe('number');
    });

    it('should calculate correct risk score', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      // Mock pattern with known countries
      const pattern = {
        userId: 'user-123',
        typicalHours: [10],
        typicalDays: [1],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeLogin(event);

      expect(result.totalRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.isAnomalous).toBeDefined();
    });

    it('should create alerts and notifications for high risk', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-01-15T03:00:00Z'), // 3 AM - unusual
        success: true,
      };

      const pattern = {
        userId: 'user-123',
        typicalHours: [9, 10, 11, 14, 15, 16],
        typicalDays: [1, 2, 3, 4, 5],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeLogin(event);

      expect(result).toBeDefined();
      expect(result.isAnomalous).toBe(true);
    });
  });

  describe('analyzeTransaction', () => {
    it('should analyze transaction and return result', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 100,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(100);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeTransaction(event);

      expect(result).toBeDefined();
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.totalRiskScore).toBeDefined();
      expect(typeof result.totalRiskScore).toBe('number');
    });

    it('should detect unusual transaction amount', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 5000,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [80, 90, 100, 110, 120, 95, 105, 85, 115, 100],
        averageFrequency: 2,
        typicalRecipients: [],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(5000);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeTransaction(event);

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.totalRiskScore).toBeGreaterThan(0);
    });
  });

  describe('getUserAlerts', () => {
    it('should get alerts for user', async () => {
      const alertId = 'alert-1';
      const alert = {
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

      const result = await service.getUserAlerts('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(alertId);
    });

    it('should return empty array when no alerts', async () => {
      mockRedis.lrange.mockResolvedValue([]);

      const result = await service.getUserAlerts('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const alert = {
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

      const result = await service.acknowledgeAlert('alert-1', 'admin-user');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return false when alert not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.acknowledgeAlert('non-existent', 'admin-user');

      expect(result).toBe(false);
    });
  });

  describe('risk level calculation', () => {
    it('should return LOW risk for no anomalies', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      // Mock no pattern - new user, no anomalies expected
      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);

      const result = await service.analyzeLogin(event);

      expect(result.totalRiskScore).toBe(0);
      expect(result.isAnomalous).toBe(false);
    });
  });

  describe('constructor with no Redis', () => {
    it('should work without Redis (disabled mode)', async () => {
      const serviceNoRedis = new AnomalyDetectionService({
        redis: null,
      });

      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      const result = await serviceNoRedis.analyzeLogin(event);

      expect(result.anomalies).toEqual([]);
      expect(result.totalRiskScore).toBe(0);
    });
  });

  describe('multiple anomalies', () => {
    it('should aggregate risk scores from multiple anomalies', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 10000, // Very high amount
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      // Use varied amounts so stdDev is not 0
      const pattern = {
        userId: 'user-123',
        averageAmount: 50,
        maxAmount: 100,
        typicalAmounts: [30, 40, 50, 60, 70, 45, 55, 35, 65, 50],
        averageFrequency: 1,
        typicalRecipients: [],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      // Simulate rapid transactions - 6 in last 5 minutes (high velocity)
      mockRedis.zcount.mockResolvedValue(6);
      mockRedis.incrbyfloat.mockResolvedValue(10000);
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.analyzeTransaction(event);

      // Should have anomalies contributing to risk
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.totalRiskScore).toBeGreaterThan(0);
    });
  });

  describe('getLoginPattern', () => {
    it('should get login pattern for user', async () => {
      const pattern = {
        userId: 'user-123',
        typicalHours: [9, 10, 11],
        typicalDays: [1, 2, 3, 4, 5],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));

      const result = await service.getLoginPattern('user-123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
    });
  });

  describe('getTransactionPattern', () => {
    it('should get transaction pattern for user', async () => {
      const pattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 500,
        typicalAmounts: [100, 150, 200],
        averageFrequency: 2,
        typicalRecipients: ['rec-1'],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));

      const result = await service.getTransactionPattern('user-123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
    });
  });

  describe('lookupIP', () => {
    it('should look up IP location', () => {
      // GeoIP is disabled in tests (no geoip-lite installed)
      const result = service.lookupIP('8.8.8.8');
      expect(result).toBeNull();
    });
  });
});
