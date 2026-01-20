/**
 * Login Pattern Analyzer
 *
 * Analyzes user login patterns to detect anomalies:
 * - Unusual login times
 * - Multiple IPs in short time windows
 * - New locations
 * - Failed attempt patterns
 *
 * Uses Redis for storing user login history and patterns
 */

import type Redis from 'ioredis';
import type {
  LoginEvent,
  LoginPattern,
  Anomaly,
  AnomalyDetectionConfig,
  GeoLocation,
} from './types';
import { DEFAULT_ANOMALY_CONFIG } from './types';
import { GeoIPService } from './geoip';

/**
 * Redis key prefixes for login pattern storage
 */
const REDIS_KEYS = {
  LOGIN_HISTORY: 'security:login_history:', // {userId}
  LOGIN_PATTERN: 'security:login_pattern:', // {userId}
  RECENT_IPS: 'security:recent_ips:', // {userId}
  FAILED_ATTEMPTS: 'security:failed_attempts:', // {userId}
};

/**
 * Login event stored in Redis
 */
interface StoredLoginEvent {
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  country?: string;
  city?: string;
}

/**
 * Login Pattern Analyzer Service
 */
export class LoginPatternAnalyzer {
  private redis: Redis | null;
  private geoIP: GeoIPService;
  private config: AnomalyDetectionConfig;

  constructor(
    redis: Redis | null,
    geoIP?: GeoIPService,
    config?: Partial<AnomalyDetectionConfig>
  ) {
    this.redis = redis;
    this.geoIP = geoIP || new GeoIPService();
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };

    if (!this.redis) {
      console.warn(
        '[LoginPatternAnalyzer] Redis not available, pattern analysis disabled'
      );
    }
  }

  /**
   * Analyze a login event for anomalies
   *
   * @param event - Login event to analyze
   * @returns Array of detected anomalies
   */
  async analyzeLogin(event: LoginEvent): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (!this.redis) {
      return anomalies;
    }

    try {
      // Get user's historical pattern
      const pattern = await this.getLoginPattern(event.userId);
      const currentLocation = this.geoIP.lookup(event.ip);

      // Check for unusual time
      if (this.config.timePatternEnabled) {
        const timeAnomaly = this.checkUnusualTime(event, pattern);
        if (timeAnomaly) {
          anomalies.push(timeAnomaly);
        }
      }

      // Check for new location
      if (this.config.geoIPEnabled && currentLocation) {
        const locationAnomalies = await this.checkLocationAnomalies(
          event,
          pattern,
          currentLocation
        );
        anomalies.push(...locationAnomalies);
      }

      // Check for multiple IPs
      const multipleIPAnomaly = await this.checkMultipleIPs(event);
      if (multipleIPAnomaly) {
        anomalies.push(multipleIPAnomaly);
      }

      // Check for impossible travel
      if (this.config.geoIPEnabled) {
        const travelAnomaly = await this.checkImpossibleTravel(
          event,
          currentLocation
        );
        if (travelAnomaly) {
          anomalies.push(travelAnomaly);
        }
      }

      // Check failed attempts pattern
      const failedAnomaly = await this.checkFailedAttempts(event);
      if (failedAnomaly) {
        anomalies.push(failedAnomaly);
      }

      // Record this login event for future pattern analysis
      await this.recordLoginEvent(event, currentLocation);
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error analyzing login:', error);
    }

    return anomalies;
  }

  /**
   * Check if login time is unusual for this user
   */
  private checkUnusualTime(
    event: LoginEvent,
    pattern: LoginPattern | null
  ): Anomaly | null {
    const hour = event.timestamp.getUTCHours();
    const day = event.timestamp.getUTCDay();

    // If no pattern established, can't determine if unusual
    if (!pattern || pattern.typicalHours.length === 0) {
      return null;
    }

    // Check if hour is within typical range
    const isTypicalHour = pattern.typicalHours.some((typicalHour) => {
      const diff = Math.abs(hour - typicalHour);
      return diff <= this.config.unusualHourWindow || diff >= 24 - this.config.unusualHourWindow;
    });

    // Check if day is typical
    const isTypicalDay = pattern.typicalDays.includes(day);

    if (!isTypicalHour || !isTypicalDay) {
      return {
        type: 'UNUSUAL_TIME',
        severity: 'MEDIUM',
        riskScore: this.config.riskScores.UNUSUAL_TIME,
        description: `Login at unusual time: ${hour}:00 UTC on ${this.getDayName(day)}`,
        details: {
          loginHour: hour,
          loginDay: day,
          typicalHours: pattern.typicalHours,
          typicalDays: pattern.typicalDays,
        },
        timestamp: event.timestamp,
      };
    }

    return null;
  }

  /**
   * Check for location-based anomalies
   */
  private async checkLocationAnomalies(
    event: LoginEvent,
    pattern: LoginPattern | null,
    location: GeoLocation
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (!pattern) {
      return anomalies;
    }

    // Check for new country
    if (
      location.countryCode &&
      !pattern.knownCountries.includes(location.countryCode)
    ) {
      anomalies.push({
        type: 'NEW_COUNTRY',
        severity: 'HIGH',
        riskScore: this.config.riskScores.NEW_COUNTRY,
        description: `Login from new country: ${location.country || location.countryCode}`,
        details: {
          newCountry: location.countryCode,
          knownCountries: pattern.knownCountries,
          city: location.city,
        },
        timestamp: event.timestamp,
      });
    } else if (
      location.city &&
      !pattern.knownCities.includes(location.city.toLowerCase())
    ) {
      // New city but same country
      anomalies.push({
        type: 'NEW_CITY',
        severity: 'LOW',
        riskScore: this.config.riskScores.NEW_CITY,
        description: `Login from new city: ${location.city}, ${location.country}`,
        details: {
          newCity: location.city,
          country: location.countryCode,
          knownCities: pattern.knownCities.slice(0, 5),
        },
        timestamp: event.timestamp,
      });
    }

    return anomalies;
  }

  /**
   * Check for multiple IPs in a short time window
   */
  private async checkMultipleIPs(event: LoginEvent): Promise<Anomaly | null> {
    if (!this.redis) {
      return null;
    }

    const key = REDIS_KEYS.RECENT_IPS + event.userId;

    try {
      // Get recent IPs within the time window
      const windowStart = Date.now() - this.config.multipleIPWindow * 1000;
      const recentIPs = await this.redis.zrangebyscore(
        key,
        windowStart,
        '+inf'
      );

      // Check if we have multiple unique IPs (excluding current)
      const uniqueIPs = new Set([...recentIPs, event.ip]);

      if (uniqueIPs.size >= 3) {
        return {
          type: 'MULTIPLE_IPS',
          severity: 'MEDIUM',
          riskScore: this.config.riskScores.MULTIPLE_IPS,
          description: `Multiple IPs detected: ${uniqueIPs.size} different IPs in ${this.config.multipleIPWindow / 60} minutes`,
          details: {
            uniqueIPCount: uniqueIPs.size,
            windowSeconds: this.config.multipleIPWindow,
            currentIP: event.ip,
          },
          timestamp: event.timestamp,
        };
      }

      // Record current IP with timestamp
      await this.redis.zadd(key, Date.now(), event.ip);
      // Clean up old entries and set expiry
      await this.redis.zremrangebyscore(key, 0, windowStart);
      await this.redis.expire(key, this.config.multipleIPWindow * 2);
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error checking multiple IPs:', error);
    }

    return null;
  }

  /**
   * Check for impossible travel between logins
   */
  private async checkImpossibleTravel(
    event: LoginEvent,
    currentLocation: GeoLocation | null
  ): Promise<Anomaly | null> {
    if (!this.redis || !currentLocation) {
      return null;
    }

    try {
      const historyKey = REDIS_KEYS.LOGIN_HISTORY + event.userId;
      const lastLoginRaw = await this.redis.lindex(historyKey, 0);

      if (!lastLoginRaw) {
        return null;
      }

      const lastLogin = JSON.parse(lastLoginRaw) as StoredLoginEvent;
      const lastLocation: GeoLocation | null = lastLogin.country
        ? {
            country: lastLogin.country,
            countryCode: lastLogin.country,
            city: lastLogin.city || null,
            region: null,
            latitude: null,
            longitude: null,
            timezone: null,
          }
        : null;

      // Get full location for last IP if available
      const lastFullLocation = this.geoIP.lookup(lastLogin.ip) || lastLocation;

      if (lastFullLocation) {
        const timeDiff =
          (event.timestamp.getTime() - new Date(lastLogin.timestamp).getTime()) /
          1000;

        if (this.geoIP.isImpossibleTravel(lastFullLocation, currentLocation, timeDiff)) {
          const distance = this.geoIP.calculateDistance(
            lastFullLocation,
            currentLocation
          );

          return {
            type: 'IMPOSSIBLE_TRAVEL',
            severity: 'CRITICAL',
            riskScore: this.config.riskScores.IMPOSSIBLE_TRAVEL,
            description: `Impossible travel detected: ${distance?.toFixed(0) || 'unknown'} km in ${(timeDiff / 60).toFixed(0)} minutes`,
            details: {
              previousLocation: this.geoIP.formatLocation(lastFullLocation),
              currentLocation: this.geoIP.formatLocation(currentLocation),
              distanceKm: distance,
              timeDiffSeconds: timeDiff,
              previousIP: lastLogin.ip,
              currentIP: event.ip,
            },
            timestamp: event.timestamp,
          };
        }
      }
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error checking impossible travel:', error);
    }

    return null;
  }

  /**
   * Check for suspicious failed attempt patterns
   */
  private async checkFailedAttempts(event: LoginEvent): Promise<Anomaly | null> {
    if (!this.redis || event.success) {
      return null; // Only check on successful login after failed attempts
    }

    try {
      const key = REDIS_KEYS.FAILED_ATTEMPTS + event.userId;
      const failedCount = await this.redis.incr(key);
      await this.redis.expire(key, 900); // 15 minute window

      // Multiple failed attempts followed by success could indicate credential stuffing
      if (failedCount >= 3) {
        return {
          type: 'FAILED_ATTEMPTS',
          severity: 'MEDIUM',
          riskScore: this.config.riskScores.FAILED_ATTEMPTS,
          description: `${failedCount} failed login attempts before successful login`,
          details: {
            failedCount,
            windowMinutes: 15,
          },
          timestamp: event.timestamp,
        };
      }

      // Reset on successful login
      if (event.success) {
        await this.redis.del(key);
      }
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error checking failed attempts:', error);
    }

    return null;
  }

  /**
   * Get user's login pattern from Redis
   */
  async getLoginPattern(userId: string): Promise<LoginPattern | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const key = REDIS_KEYS.LOGIN_PATTERN + userId;
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as LoginPattern;
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error getting pattern:', error);
      return null;
    }
  }

  /**
   * Record a login event and update patterns
   */
  private async recordLoginEvent(
    event: LoginEvent,
    location: GeoLocation | null
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const historyKey = REDIS_KEYS.LOGIN_HISTORY + event.userId;

      // Store the login event
      const storedEvent: StoredLoginEvent = {
        ip: event.ip,
        userAgent: event.userAgent,
        timestamp: event.timestamp.toISOString(),
        success: event.success,
        country: location?.countryCode || undefined,
        city: location?.city || undefined,
      };

      await this.redis.lpush(historyKey, JSON.stringify(storedEvent));
      await this.redis.ltrim(historyKey, 0, 99); // Keep last 100 logins
      await this.redis.expire(
        historyKey,
        this.config.loginHistoryDays * 24 * 3600
      );

      // Update user's pattern
      await this.updateLoginPattern(event, location);
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error recording login:', error);
    }
  }

  /**
   * Update user's login pattern based on new event
   */
  private async updateLoginPattern(
    event: LoginEvent,
    location: GeoLocation | null
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const key = REDIS_KEYS.LOGIN_PATTERN + event.userId;
      let pattern = await this.getLoginPattern(event.userId);

      if (!pattern) {
        pattern = {
          userId: event.userId,
          typicalHours: [],
          typicalDays: [],
          knownCountries: [],
          knownCities: [],
          knownIPs: [],
          averageLoginFrequency: 0,
          lastUpdated: new Date(),
        };
      }

      const hour = event.timestamp.getUTCHours();
      const day = event.timestamp.getUTCDay();

      // Update typical hours (keep up to 10 most common)
      if (!pattern.typicalHours.includes(hour)) {
        pattern.typicalHours.push(hour);
        if (pattern.typicalHours.length > 10) {
          pattern.typicalHours.shift();
        }
      }

      // Update typical days
      if (!pattern.typicalDays.includes(day)) {
        pattern.typicalDays.push(day);
      }

      // Update known locations
      if (location?.countryCode && !pattern.knownCountries.includes(location.countryCode)) {
        pattern.knownCountries.push(location.countryCode);
      }

      if (location?.city) {
        const cityLower = location.city.toLowerCase();
        if (!pattern.knownCities.includes(cityLower)) {
          pattern.knownCities.push(cityLower);
          if (pattern.knownCities.length > 20) {
            pattern.knownCities.shift();
          }
        }
      }

      // Update known IPs
      if (!pattern.knownIPs.includes(event.ip)) {
        pattern.knownIPs.push(event.ip);
        if (pattern.knownIPs.length > 50) {
          pattern.knownIPs.shift();
        }
      }

      pattern.lastUpdated = new Date();

      await this.redis.set(
        key,
        JSON.stringify(pattern),
        'EX',
        this.config.loginHistoryDays * 24 * 3600
      );
    } catch (error) {
      console.error('[LoginPatternAnalyzer] Error updating pattern:', error);
    }
  }

  private getDayName(day: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[day] || 'Unknown';
  }
}
