/**
 * Transaction Anomaly Detector Tests
 */

import { TransactionAnomalyDetector } from './transaction-anomaly-detector';
import type { TransactionEvent, TransactionPattern } from './types';

// Mock Redis
const createMockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  expire: jest.fn(),
  zadd: jest.fn(),
  zcount: jest.fn(),
  zremrangebyscore: jest.fn(),
  incrbyfloat: jest.fn(),
});

describe('TransactionAnomalyDetector', () => {
  let detector: TransactionAnomalyDetector;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    detector = new TransactionAnomalyDetector(mockRedis as any);
  });

  describe('analyzeTransaction', () => {
    it('should return empty array when Redis is not available', async () => {
      const detectorNoRedis = new TransactionAnomalyDetector(null);
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 100,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const result = await detectorNoRedis.analyzeTransaction(event);
      expect(result).toEqual([]);
    });

    it('should analyze transaction and record event', async () => {
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

      const result = await detector.analyzeTransaction(event);

      expect(result).toBeInstanceOf(Array);
      expect(mockRedis.lpush).toHaveBeenCalled();
    });
  });

  describe('checkUnusualAmount', () => {
    it('should detect unusually high transaction amount', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 5000, // Much higher than average
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [80, 90, 100, 110, 120, 95, 105, 85, 115, 100],
        averageFrequency: 2,
        typicalRecipients: ['recipient-1'],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(5000);

      const result = await detector.analyzeTransaction(event);

      const amountAnomaly = result.find((a) => a.type === 'UNUSUAL_AMOUNT');
      expect(amountAnomaly).toBeDefined();
      expect(amountAnomaly?.severity).toBe('HIGH');
    });

    it('should not flag normal transaction amount', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 105,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [80, 90, 100, 110, 120, 95, 105, 85, 115, 100],
        averageFrequency: 2,
        typicalRecipients: ['recipient-1'],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(105);

      const result = await detector.analyzeTransaction(event);

      const amountAnomaly = result.find((a) => a.type === 'UNUSUAL_AMOUNT');
      expect(amountAnomaly).toBeUndefined();
    });

    it('should detect amount exceeding historical max', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 500, // 2.5x max, 5x average
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [100, 100, 100, 100, 100], // Low variance
        averageFrequency: 2,
        typicalRecipients: ['recipient-1'],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(500);

      const result = await detector.analyzeTransaction(event);

      const amountAnomaly = result.find((a) => a.type === 'UNUSUAL_AMOUNT');
      expect(amountAnomaly).toBeDefined();
    });
  });

  describe('checkHighFrequency', () => {
    it('should detect high transaction frequency', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 100,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [100],
        averageFrequency: 2, // 2 transactions per day typical
        typicalRecipients: [],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      // Return high count for 24-hour window (simulating 10 transactions)
      mockRedis.zcount.mockImplementation((key: string, min: number) => {
        if (min > Date.now() - 25 * 60 * 60 * 1000) {
          return Promise.resolve(10); // High frequency in 24 hours
        }
        return Promise.resolve(1);
      });
      mockRedis.incrbyfloat.mockResolvedValue(100);

      const result = await detector.analyzeTransaction(event);

      const frequencyAnomaly = result.find((a) => a.type === 'HIGH_FREQUENCY');
      expect(frequencyAnomaly).toBeDefined();
    });
  });

  describe('checkVelocity', () => {
    it('should detect rapid transaction velocity', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 100,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      // Simulate 6 transactions in last 5 minutes
      mockRedis.zcount.mockImplementation((key: string, min: number) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (min >= fiveMinutesAgo - 1000) {
          return Promise.resolve(6);
        }
        return Promise.resolve(10);
      });
      mockRedis.incrbyfloat.mockResolvedValue(100);

      const result = await detector.analyzeTransaction(event);

      const velocityAnomaly = result.find(
        (a) => a.type === 'HIGH_FREQUENCY' && a.details.windowMinutes === 5
      );
      expect(velocityAnomaly).toBeDefined();
      expect(velocityAnomaly?.severity).toBe('HIGH');
    });

    it('should detect high hourly transaction rate', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 100,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zcount.mockImplementation((key: string, min: number) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (min >= fiveMinutesAgo - 1000) {
          return Promise.resolve(2); // Low 5-min count
        }
        if (min >= oneHourAgo - 1000) {
          return Promise.resolve(25); // High hourly count
        }
        return Promise.resolve(30);
      });
      mockRedis.incrbyfloat.mockResolvedValue(100);

      const result = await detector.analyzeTransaction(event);

      const hourlyAnomaly = result.find(
        (a) => a.type === 'HIGH_FREQUENCY' && a.details.windowMinutes === 60
      );
      expect(hourlyAnomaly).toBeDefined();
      expect(hourlyAnomaly?.severity).toBe('MEDIUM');
    });
  });

  describe('checkDailyTotal', () => {
    it('should detect unusually high daily total', async () => {
      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 1000,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [100],
        averageFrequency: 2, // 2 transactions/day * $100 = $200 typical daily
        typicalRecipients: [],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zcount.mockResolvedValue(1);
      mockRedis.incrbyfloat.mockResolvedValue(1000); // Daily total now $1000 (5x typical)

      const result = await detector.analyzeTransaction(event);

      const dailyAnomaly = result.find(
        (a) => a.type === 'UNUSUAL_AMOUNT' && a.details.dailyTotal !== undefined
      );
      expect(dailyAnomaly).toBeDefined();
      expect(dailyAnomaly?.severity).toBe('HIGH');
    });
  });

  describe('getTransactionPattern', () => {
    it('should return null when Redis is not available', async () => {
      const detectorNoRedis = new TransactionAnomalyDetector(null);
      const result = await detectorNoRedis.getTransactionPattern('user-123');
      expect(result).toBeNull();
    });

    it('should return pattern from Redis', async () => {
      const pattern: TransactionPattern = {
        userId: 'user-123',
        averageAmount: 100,
        maxAmount: 200,
        typicalAmounts: [80, 90, 100, 110, 120],
        averageFrequency: 2,
        typicalRecipients: ['recipient-1'],
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));

      const result = await detector.getTransactionPattern('user-123');
      // Date is serialized as string in JSON, so compare relevant fields
      expect(result?.userId).toEqual(pattern.userId);
      expect(result?.averageAmount).toEqual(pattern.averageAmount);
      expect(result?.typicalAmounts).toEqual(pattern.typicalAmounts);
    });

    it('should return null when pattern not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await detector.getTransactionPattern('user-123');
      expect(result).toBeNull();
    });
  });

  describe('disabled analysis', () => {
    it('should return empty array when transaction analysis is disabled', async () => {
      const disabledDetector = new TransactionAnomalyDetector(mockRedis as any, {
        transactionAnalysisEnabled: false,
      });

      const event: TransactionEvent = {
        userId: 'user-123',
        transactionId: 'tx-123',
        amount: 10000,
        currency: 'USD',
        type: 'PAYMENT',
        timestamp: new Date(),
      };

      const result = await disabledDetector.analyzeTransaction(event);
      expect(result).toEqual([]);
    });
  });
});
