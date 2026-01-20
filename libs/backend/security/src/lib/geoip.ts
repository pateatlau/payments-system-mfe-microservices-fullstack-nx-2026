/**
 * GeoIP Service
 *
 * Provides geographic location detection from IP addresses
 * Uses geoip-lite for offline IP geolocation (no external API calls)
 *
 * Features:
 * - IP to location lookup
 * - Distance calculation between locations
 * - Impossible travel detection
 */

import type { GeoLocation } from './types';

// Lazy load geoip-lite to handle optional peer dependency
let geoip: typeof import('geoip-lite') | null = null;

function getGeoIP(): typeof import('geoip-lite') | null {
  if (geoip === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      geoip = require('geoip-lite');
    } catch {
      console.warn(
        '[GeoIPService] geoip-lite not installed, GeoIP features disabled'
      );
      geoip = null;
    }
  }
  return geoip;
}

/**
 * GeoIP Service for IP location detection
 */
export class GeoIPService {
  private enabled: boolean;

  constructor() {
    const geo = getGeoIP();
    this.enabled = geo !== null;

    if (!this.enabled) {
      console.warn(
        '[GeoIPService] GeoIP features disabled - install geoip-lite to enable'
      );
    }
  }

  /**
   * Check if GeoIP service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Look up geographic location for an IP address
   *
   * @param ip - IP address (IPv4 or IPv6)
   * @returns GeoLocation or null if not found
   */
  lookup(ip: string): GeoLocation | null {
    if (!this.enabled) {
      return null;
    }

    const geo = getGeoIP();
    if (!geo) {
      return null;
    }

    // Handle localhost and private IPs
    if (this.isPrivateIP(ip)) {
      return {
        country: 'Local',
        countryCode: 'XX',
        region: null,
        city: 'Localhost',
        latitude: null,
        longitude: null,
        timezone: null,
      };
    }

    try {
      const result = geo.lookup(ip);

      if (!result) {
        return null;
      }

      return {
        country: result.country || null,
        countryCode: result.country || null,
        region: result.region || null,
        city: result.city || null,
        latitude: result.ll?.[0] || null,
        longitude: result.ll?.[1] || null,
        timezone: result.timezone || null,
      };
    } catch (error) {
      console.error('[GeoIPService] Error looking up IP:', error);
      return null;
    }
  }

  /**
   * Check if an IP address is a private/local address
   */
  isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const privateIPv4Ranges = [
      /^127\./, // Loopback
      /^10\./, // Class A private
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
      /^192\.168\./, // Class C private
      /^0\./, // Current network
      /^169\.254\./, // Link-local
    ];

    // IPv6 private/special ranges
    const privateIPv6Patterns = [
      /^::1$/, // Loopback
      /^fe80:/i, // Link-local
      /^fc00:/i, // Unique local address
      /^fd00:/i, // Unique local address
    ];

    // Check IPv4
    for (const pattern of privateIPv4Ranges) {
      if (pattern.test(ip)) {
        return true;
      }
    }

    // Check IPv6
    for (const pattern of privateIPv6Patterns) {
      if (pattern.test(ip)) {
        return true;
      }
    }

    // Handle ::ffff:IPv4 format
    if (ip.startsWith('::ffff:')) {
      return this.isPrivateIP(ip.substring(7));
    }

    return false;
  }

  /**
   * Calculate distance between two locations in kilometers
   * Uses Haversine formula
   *
   * @param loc1 - First location
   * @param loc2 - Second location
   * @returns Distance in kilometers, or null if coordinates unavailable
   */
  calculateDistance(
    loc1: GeoLocation | null,
    loc2: GeoLocation | null
  ): number | null {
    if (!loc1 || !loc2) {
      return null;
    }

    if (
      loc1.latitude === null ||
      loc1.longitude === null ||
      loc2.latitude === null ||
      loc2.longitude === null
    ) {
      return null;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) *
        Math.cos(this.toRadians(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check for impossible travel between two locations
   * Impossible travel = distance that cannot be covered in the given time
   *
   * @param loc1 - First location
   * @param loc2 - Second location
   * @param timeDiffSeconds - Time difference in seconds
   * @param maxSpeedKmh - Maximum realistic travel speed (default: 1000 km/h for flights)
   * @returns true if travel is impossible
   */
  isImpossibleTravel(
    loc1: GeoLocation | null,
    loc2: GeoLocation | null,
    timeDiffSeconds: number,
    maxSpeedKmh = 1000
  ): boolean {
    const distance = this.calculateDistance(loc1, loc2);

    if (distance === null) {
      return false; // Can't determine, assume possible
    }

    // If same location, not impossible
    if (distance < 50) {
      // Within 50km is considered same area
      return false;
    }

    const timeDiffHours = timeDiffSeconds / 3600;
    const requiredSpeed = distance / timeDiffHours;

    return requiredSpeed > maxSpeedKmh;
  }

  /**
   * Check if two locations are in the same country
   */
  isSameCountry(
    loc1: GeoLocation | null,
    loc2: GeoLocation | null
  ): boolean {
    if (!loc1 || !loc2) {
      return true; // Assume same if unknown
    }

    if (!loc1.countryCode || !loc2.countryCode) {
      return true;
    }

    return loc1.countryCode === loc2.countryCode;
  }

  /**
   * Check if two locations are in the same city
   */
  isSameCity(loc1: GeoLocation | null, loc2: GeoLocation | null): boolean {
    if (!loc1 || !loc2) {
      return true; // Assume same if unknown
    }

    if (!loc1.city || !loc2.city) {
      return true;
    }

    // Check city and country match
    return (
      loc1.city.toLowerCase() === loc2.city.toLowerCase() &&
      this.isSameCountry(loc1, loc2)
    );
  }

  /**
   * Get a human-readable location string
   */
  formatLocation(location: GeoLocation | null): string {
    if (!location) {
      return 'Unknown location';
    }

    const parts: string[] = [];

    if (location.city) {
      parts.push(location.city);
    }
    if (location.region) {
      parts.push(location.region);
    }
    if (location.country) {
      parts.push(location.country);
    }

    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
