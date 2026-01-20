/**
 * GeoIP Service Tests
 */

import { GeoIPService } from './geoip';

describe('GeoIPService', () => {
  let service: GeoIPService;

  beforeEach(() => {
    service = new GeoIPService();
  });

  describe('isPrivateIP', () => {
    it('should identify localhost IPv4', () => {
      expect(service.isPrivateIP('127.0.0.1')).toBe(true);
      expect(service.isPrivateIP('127.0.0.255')).toBe(true);
    });

    it('should identify private IPv4 ranges', () => {
      // Class A private
      expect(service.isPrivateIP('10.0.0.1')).toBe(true);
      expect(service.isPrivateIP('10.255.255.255')).toBe(true);

      // Class B private
      expect(service.isPrivateIP('172.16.0.1')).toBe(true);
      expect(service.isPrivateIP('172.31.255.255')).toBe(true);

      // Class C private
      expect(service.isPrivateIP('192.168.0.1')).toBe(true);
      expect(service.isPrivateIP('192.168.255.255')).toBe(true);
    });

    it('should identify link-local addresses', () => {
      expect(service.isPrivateIP('169.254.0.1')).toBe(true);
      expect(service.isPrivateIP('169.254.255.255')).toBe(true);
    });

    it('should identify public IPv4 addresses', () => {
      expect(service.isPrivateIP('8.8.8.8')).toBe(false);
      expect(service.isPrivateIP('203.0.113.42')).toBe(false);
      expect(service.isPrivateIP('1.2.3.4')).toBe(false);
    });

    it('should identify IPv6 loopback', () => {
      expect(service.isPrivateIP('::1')).toBe(true);
    });

    it('should identify IPv6 link-local', () => {
      expect(service.isPrivateIP('fe80::1')).toBe(true);
      expect(service.isPrivateIP('FE80::abcd:1234')).toBe(true);
    });

    it('should handle ::ffff: prefixed IPv4', () => {
      expect(service.isPrivateIP('::ffff:127.0.0.1')).toBe(true);
      expect(service.isPrivateIP('::ffff:192.168.1.1')).toBe(true);
      expect(service.isPrivateIP('::ffff:8.8.8.8')).toBe(false);
    });
  });

  describe('lookup', () => {
    it('should return local location for private IPs', () => {
      const result = service.lookup('127.0.0.1');

      if (service.isEnabled()) {
        expect(result).not.toBeNull();
        expect(result?.country).toBe('Local');
        expect(result?.city).toBe('Localhost');
      } else {
        expect(result).toBeNull();
      }
    });

    it('should return null for invalid IPs', () => {
      const result = service.lookup('not-an-ip');
      expect(result).toBeNull();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two locations', () => {
      const loc1 = {
        country: 'US',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      const loc2 = {
        country: 'UK',
        countryCode: 'UK',
        city: 'London',
        region: null,
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
      };

      const distance = service.calculateDistance(loc1, loc2);

      expect(distance).not.toBeNull();
      // NYC to London is approximately 5570 km
      expect(distance).toBeGreaterThan(5000);
      expect(distance).toBeLessThan(6000);
    });

    it('should return null if coordinates are missing', () => {
      const loc1 = {
        country: 'US',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: null,
        longitude: null,
        timezone: null,
      };

      const loc2 = {
        country: 'UK',
        countryCode: 'UK',
        city: 'London',
        region: null,
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
      };

      expect(service.calculateDistance(loc1, loc2)).toBeNull();
      expect(service.calculateDistance(null, loc2)).toBeNull();
      expect(service.calculateDistance(loc1, null)).toBeNull();
    });

    it('should return 0 for same location', () => {
      const loc = {
        country: 'US',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      const distance = service.calculateDistance(loc, loc);
      expect(distance).toBe(0);
    });
  });

  describe('isImpossibleTravel', () => {
    it('should detect impossible travel', () => {
      const nyc = {
        country: 'US',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      const london = {
        country: 'UK',
        countryCode: 'UK',
        city: 'London',
        region: null,
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
      };

      // 1 hour between NYC and London - impossible
      expect(service.isImpossibleTravel(nyc, london, 3600)).toBe(true);

      // 8 hours between NYC and London - possible
      expect(service.isImpossibleTravel(nyc, london, 8 * 3600)).toBe(false);
    });

    it('should not flag nearby locations as impossible', () => {
      const loc1 = {
        country: 'US',
        countryCode: 'US',
        city: 'Manhattan',
        region: 'NY',
        latitude: 40.7831,
        longitude: -73.9712,
        timezone: 'America/New_York',
      };

      const loc2 = {
        country: 'US',
        countryCode: 'US',
        city: 'Brooklyn',
        region: 'NY',
        latitude: 40.6782,
        longitude: -73.9442,
        timezone: 'America/New_York',
      };

      // Same city area - even short time should be possible
      expect(service.isImpossibleTravel(loc1, loc2, 60)).toBe(false);
    });
  });

  describe('isSameCountry', () => {
    it('should correctly compare countries', () => {
      const usLoc = {
        country: 'United States',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      const ukLoc = {
        country: 'United Kingdom',
        countryCode: 'UK',
        city: 'London',
        region: null,
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
      };

      expect(service.isSameCountry(usLoc, usLoc)).toBe(true);
      expect(service.isSameCountry(usLoc, ukLoc)).toBe(false);
      expect(service.isSameCountry(null, usLoc)).toBe(true); // Assume same if unknown
    });
  });

  describe('formatLocation', () => {
    it('should format location with all fields', () => {
      const loc = {
        country: 'United States',
        countryCode: 'US',
        city: 'New York',
        region: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
      };

      expect(service.formatLocation(loc)).toBe('New York, NY, United States');
    });

    it('should handle missing fields', () => {
      expect(service.formatLocation(null)).toBe('Unknown location');
      expect(
        service.formatLocation({
          country: 'US',
          countryCode: 'US',
          city: null,
          region: null,
          latitude: null,
          longitude: null,
          timezone: null,
        })
      ).toBe('US');
    });
  });
});
