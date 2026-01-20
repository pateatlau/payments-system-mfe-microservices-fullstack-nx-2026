/**
 * Login Pattern Analyzer Tests
 */

import { LoginPatternAnalyzer } from './login-pattern-analyzer';
import type { LoginEvent, LoginPattern, GeoLocation } from './types';
import { GeoIPService } from './geoip';
import type Redis from 'ioredis';

// Mock Redis type for testing
type MockRedis = {
  get: jest.Mock;
  set: jest.Mock;
  lpush: jest.Mock;
  ltrim: jest.Mock;
  lindex: jest.Mock;
  expire: jest.Mock;
  incr: jest.Mock;
  del: jest.Mock;
  zadd: jest.Mock;
  zrangebyscore: jest.Mock;
  zremrangebyscore: jest.Mock;
};

const createMockRedis = (): MockRedis => ({
  get: jest.fn(),
  set: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  lindex: jest.fn(),
  expire: jest.fn(),
  incr: jest.fn(),
  del: jest.fn(),
  zadd: jest.fn(),
  zrangebyscore: jest.fn(),
  zremrangebyscore: jest.fn(),
});

describe('LoginPatternAnalyzer', () => {
  let analyzer: LoginPatternAnalyzer;
  let mockRedis: MockRedis;
  let mockGeoIP: jest.Mocked<GeoIPService>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    mockGeoIP = {
      lookup: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      isPrivateIP: jest.fn(),
      calculateDistance: jest.fn(),
      isImpossibleTravel: jest.fn(),
      isSameCountry: jest.fn(),
      isSameCity: jest.fn(),
      formatLocation: jest.fn(),
    } as unknown as jest.Mocked<GeoIPService>;

    analyzer = new LoginPatternAnalyzer(mockRedis as unknown as Redis, mockGeoIP);
  });

  describe('analyzeLogin', () => {
    it('should return empty array when Redis is not available', async () => {
      const analyzerNoRedis = new LoginPatternAnalyzer(null);
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      const result = await analyzerNoRedis.analyzeLogin(event);
      expect(result).toEqual([]);
    });

    it('should analyze login and record event', async () => {
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
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      expect(result).toBeInstanceOf(Array);
      expect(mockRedis.lpush).toHaveBeenCalled();
    });
  });

  describe('checkUnusualTime', () => {
    it('should detect login at unusual time', async () => {
      // Create a timestamp at 3 AM UTC
      const unusualTime = new Date();
      unusualTime.setUTCHours(3, 0, 0, 0);

      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: unusualTime,
        success: true,
      };

      const pattern: LoginPattern = {
        userId: 'user-123',
        typicalHours: [9, 10, 11, 14, 15, 16], // Business hours
        typicalDays: [1, 2, 3, 4, 5], // Weekdays
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      const unusualTimeAnomaly = result.find((a) => a.type === 'UNUSUAL_TIME');
      expect(unusualTimeAnomaly).toBeDefined();
      expect(unusualTimeAnomaly?.severity).toBe('MEDIUM');
    });

    it('should not flag login at typical time', async () => {
      // Create a timestamp at 10 AM UTC on a weekday
      const typicalTime = new Date('2024-01-15T10:00:00Z'); // Monday

      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: typicalTime,
        success: true,
      };

      const pattern: LoginPattern = {
        userId: 'user-123',
        typicalHours: [9, 10, 11, 14, 15, 16],
        typicalDays: [1, 2, 3, 4, 5],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['8.8.8.8'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      const unusualTimeAnomaly = result.find((a) => a.type === 'UNUSUAL_TIME');
      expect(unusualTimeAnomaly).toBeUndefined();
    });
  });

  describe('checkLocationAnomalies', () => {
    it('should detect login from new country', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        success: true,
      };

      const pattern: LoginPattern = {
        userId: 'user-123',
        typicalHours: [10],
        typicalDays: [1],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      const newLocation: GeoLocation = {
        country: 'Russia',
        countryCode: 'RU',
        city: 'Moscow',
        region: null,
        latitude: 55.7558,
        longitude: 37.6173,
        timezone: 'Europe/Moscow',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(newLocation);

      const result = await analyzer.analyzeLogin(event);

      const newCountryAnomaly = result.find((a) => a.type === 'NEW_COUNTRY');
      expect(newCountryAnomaly).toBeDefined();
      expect(newCountryAnomaly?.severity).toBe('HIGH');
      expect(newCountryAnomaly?.details.newCountry).toBe('RU');
    });

    it('should detect login from new city', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        success: true,
      };

      const pattern: LoginPattern = {
        userId: 'user-123',
        typicalHours: [10],
        typicalDays: [1],
        knownCountries: ['US'],
        knownCities: ['new york'],
        knownIPs: ['1.2.3.4'],
        averageLoginFrequency: 2,
        lastUpdated: new Date(),
      };

      const newLocation: GeoLocation = {
        country: 'United States',
        countryCode: 'US',
        city: 'Los Angeles',
        region: 'CA',
        latitude: 34.0522,
        longitude: -118.2437,
        timezone: 'America/Los_Angeles',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(pattern));
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(newLocation);

      const result = await analyzer.analyzeLogin(event);

      const newCityAnomaly = result.find((a) => a.type === 'NEW_CITY');
      expect(newCityAnomaly).toBeDefined();
      expect(newCityAnomaly?.severity).toBe('LOW');
    });
  });

  describe('checkMultipleIPs', () => {
    it('should detect multiple IPs in short window', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrangebyscore.mockResolvedValue(['1.1.1.1', '2.2.2.2', '3.3.3.3']);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      const multipleIPsAnomaly = result.find((a) => a.type === 'MULTIPLE_IPS');
      expect(multipleIPsAnomaly).toBeDefined();
      expect(multipleIPsAnomaly?.severity).toBe('MEDIUM');
    });
  });

  describe('checkImpossibleTravel', () => {
    it('should detect impossible travel', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      const lastLogin = {
        ip: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        success: true,
        country: 'US',
        city: 'New York',
      };

      const currentLocation: GeoLocation = {
        country: 'Japan',
        countryCode: 'JP',
        city: 'Tokyo',
        region: null,
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
      };

      const lastLocation: GeoLocation = {
        country: 'United States',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(JSON.stringify(lastLogin));
      mockGeoIP.lookup.mockImplementation((ip) => {
        if (ip === '203.0.113.42') return currentLocation;
        if (ip === '1.2.3.4') return lastLocation;
        return null;
      });
      mockGeoIP.isImpossibleTravel.mockReturnValue(true);
      mockGeoIP.calculateDistance.mockReturnValue(10850);
      mockGeoIP.formatLocation.mockImplementation((loc) =>
        loc ? `${loc.city}, ${loc.country}` : 'Unknown'
      );

      const result = await analyzer.analyzeLogin(event);

      const travelAnomaly = result.find((a) => a.type === 'IMPOSSIBLE_TRAVEL');
      expect(travelAnomaly).toBeDefined();
      expect(travelAnomaly?.severity).toBe('CRITICAL');
    });
  });

  describe('checkFailedAttempts', () => {
    it('should increment counter on failed login (no anomaly emitted)', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: false,
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(5);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      // On failed login, no FAILED_ATTEMPTS anomaly is emitted - counter is just incremented
      const failedAnomaly = result.find((a) => a.type === 'FAILED_ATTEMPTS');
      expect(failedAnomaly).toBeUndefined();

      // Verify incr was called
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should emit anomaly on successful login after multiple failed attempts', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      // Mock 5 prior failed attempts
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('failed_attempts:')) {
          return Promise.resolve('5');
        }
        return Promise.resolve(null);
      });
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      // On successful login after failed attempts, FAILED_ATTEMPTS anomaly is emitted
      const failedAnomaly = result.find((a) => a.type === 'FAILED_ATTEMPTS');
      expect(failedAnomaly).toBeDefined();
      expect(failedAnomaly?.details.failedCount).toBe(5);

      // Verify counter was deleted
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should not emit anomaly on successful login with no prior failed attempts', async () => {
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
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      const failedAnomaly = result.find((a) => a.type === 'FAILED_ATTEMPTS');
      expect(failedAnomaly).toBeUndefined();
    });

    it('should not emit anomaly if failed count is below threshold', async () => {
      const event: LoginEvent = {
        userId: 'user-123',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        success: true,
      };

      // Only 2 failed attempts (below threshold of 3)
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('failed_attempts:')) {
          return Promise.resolve('2');
        }
        return Promise.resolve(null);
      });
      mockRedis.zrangebyscore.mockResolvedValue([]);
      mockRedis.lindex.mockResolvedValue(null);
      mockGeoIP.lookup.mockReturnValue(null);

      const result = await analyzer.analyzeLogin(event);

      const failedAnomaly = result.find((a) => a.type === 'FAILED_ATTEMPTS');
      expect(failedAnomaly).toBeUndefined();

      // Counter should still be deleted on successful login
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('getLoginPattern', () => {
    it('should return null when Redis is not available', async () => {
      const analyzerNoRedis = new LoginPatternAnalyzer(null);
      const result = await analyzerNoRedis.getLoginPattern('user-123');
      expect(result).toBeNull();
    });

    it('should return pattern from Redis', async () => {
      const pattern: LoginPattern = {
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

      const result = await analyzer.getLoginPattern('user-123');
      // Date is serialized as string in JSON, so compare relevant fields
      expect(result?.userId).toEqual(pattern.userId);
      expect(result?.typicalHours).toEqual(pattern.typicalHours);
      expect(result?.typicalDays).toEqual(pattern.typicalDays);
      expect(result?.knownCountries).toEqual(pattern.knownCountries);
    });

    it('should return null when pattern not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await analyzer.getLoginPattern('user-123');
      expect(result).toBeNull();
    });
  });
});
