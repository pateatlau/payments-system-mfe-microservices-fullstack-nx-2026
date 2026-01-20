/**
 * Anomaly Detection Service
 *
 * Main orchestrator for security anomaly detection.
 * Combines GeoIP, login patterns, transaction analysis, and alerting.
 *
 * Usage:
 * ```typescript
 * const service = new AnomalyDetectionService(redis, config);
 *
 * // Analyze login
 * const result = await service.analyzeLogin({
 *   userId: 'user-123',
 *   ip: '203.0.113.42',
 *   userAgent: 'Mozilla/5.0...',
 *   timestamp: new Date(),
 *   success: true,
 * });
 *
 * // Analyze transaction
 * const result = await service.analyzeTransaction({
 *   userId: 'user-123',
 *   transactionId: 'tx-456',
 *   amount: 1000,
 *   currency: 'USD',
 *   type: 'PAYMENT',
 *   timestamp: new Date(),
 * });
 * ```
 */

import type Redis from 'ioredis';
import type {
  LoginEvent,
  TransactionEvent,
  AnomalyAnalysisResult,
  AnomalyDetectionConfig,
  Anomaly,
} from './types';
import { DEFAULT_ANOMALY_CONFIG } from './types';
import { GeoIPService } from './geoip';
import { LoginPatternAnalyzer } from './login-pattern-analyzer';
import { TransactionAnomalyDetector } from './transaction-anomaly-detector';
import { AlertService, type EmailService } from './alert-service';

/**
 * Configuration for initializing the anomaly detection service
 */
export interface AnomalyDetectionServiceConfig {
  redis: Redis | null;
  config?: Partial<AnomalyDetectionConfig>;
  emailService?: EmailService;
  alertConfig?: {
    riskThreshold?: number;
    userNotificationThreshold?: number;
    enableEmail?: boolean;
    enableSlack?: boolean;
    slackWebhookUrl?: string;
    adminEmails?: string[];
  };
}

/**
 * Anomaly Detection Service
 *
 * Main entry point for all security anomaly detection functionality.
 */
export class AnomalyDetectionService {
  private geoIP: GeoIPService;
  private loginAnalyzer: LoginPatternAnalyzer;
  private transactionDetector: TransactionAnomalyDetector;
  private alertService: AlertService;
  private config: AnomalyDetectionConfig;

  constructor(options: AnomalyDetectionServiceConfig) {
    const { redis, config, emailService, alertConfig } = options;

    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
    this.geoIP = new GeoIPService();
    this.loginAnalyzer = new LoginPatternAnalyzer(redis, this.geoIP, this.config);
    this.transactionDetector = new TransactionAnomalyDetector(redis, this.config);
    this.alertService = new AlertService(redis, alertConfig, emailService);

    console.log('[AnomalyDetectionService] Initialized with config:', {
      geoIPEnabled: this.config.geoIPEnabled && this.geoIP.isEnabled(),
      timePatternEnabled: this.config.timePatternEnabled,
      transactionAnalysisEnabled: this.config.transactionAnalysisEnabled,
      alertRiskThreshold: this.config.alertRiskThreshold,
      userNotificationRiskThreshold: this.config.userNotificationRiskThreshold,
    });
  }

  /**
   * Analyze a login event for anomalies
   *
   * @param event - Login event to analyze
   * @returns Analysis result with anomalies, risk score, and recommendations
   */
  async analyzeLogin(event: LoginEvent): Promise<AnomalyAnalysisResult> {
    const startTime = Date.now();

    try {
      // Run login pattern analysis
      const anomalies = await this.loginAnalyzer.analyzeLogin(event);

      // Calculate total risk score
      const totalRiskScore = this.calculateTotalRiskScore(anomalies);

      // Determine if alerts/notifications should be sent
      const shouldAlert = totalRiskScore >= this.config.alertRiskThreshold;
      const shouldNotifyUser =
        totalRiskScore >= this.config.userNotificationRiskThreshold;

      // Generate recommendations (pass pre-calculated totalRiskScore)
      const recommendations = this.generateRecommendations(
        anomalies,
        'LOGIN',
        totalRiskScore
      );

      // Get location for alert context
      const location = this.geoIP.lookup(event.ip);

      // Send alerts if threshold exceeded
      if (shouldAlert) {
        await this.alertService.createAlert(
          event.userId,
          'LOGIN',
          anomalies,
          totalRiskScore,
          location,
          event.ip
        );
      }

      // Send user notification if threshold exceeded
      if (shouldNotifyUser) {
        const notificationType = anomalies.some(
          (a) => a.type === 'NEW_COUNTRY' || a.type === 'NEW_CITY'
        )
          ? 'NEW_LOGIN'
          : 'UNUSUAL_ACTIVITY';

        await this.alertService.createUserNotification(
          event.userId,
          notificationType,
          anomalies,
          totalRiskScore
        );
      }

      const result: AnomalyAnalysisResult = {
        isAnomalous: anomalies.length > 0,
        totalRiskScore,
        anomalies,
        recommendations,
        shouldAlert,
        shouldNotifyUser,
      };

      // Log analysis result
      if (anomalies.length > 0) {
        console.log('[AnomalyDetectionService] Login anomalies detected:', {
          userId: event.userId,
          anomalyCount: anomalies.length,
          totalRiskScore,
          durationMs: Date.now() - startTime,
        });
      }

      return result;
    } catch (error) {
      console.error('[AnomalyDetectionService] Error analyzing login:', error);

      return {
        isAnomalous: false,
        totalRiskScore: 0,
        anomalies: [],
        recommendations: [],
        shouldAlert: false,
        shouldNotifyUser: false,
      };
    }
  }

  /**
   * Analyze a transaction for anomalies
   *
   * @param event - Transaction event to analyze
   * @returns Analysis result with anomalies, risk score, and recommendations
   */
  async analyzeTransaction(
    event: TransactionEvent
  ): Promise<AnomalyAnalysisResult> {
    const startTime = Date.now();

    try {
      // Run transaction analysis
      const anomalies = await this.transactionDetector.analyzeTransaction(event);

      // Calculate total risk score
      const totalRiskScore = this.calculateTotalRiskScore(anomalies);

      // Determine if alerts/notifications should be sent
      const shouldAlert = totalRiskScore >= this.config.alertRiskThreshold;
      const shouldNotifyUser =
        totalRiskScore >= this.config.userNotificationRiskThreshold;

      // Generate recommendations (pass pre-calculated totalRiskScore)
      const recommendations = this.generateRecommendations(
        anomalies,
        'TRANSACTION',
        totalRiskScore
      );

      // Send alerts if threshold exceeded
      if (shouldAlert) {
        await this.alertService.createAlert(
          event.userId,
          'TRANSACTION',
          anomalies,
          totalRiskScore
        );
      }

      // Send user notification if threshold exceeded
      if (shouldNotifyUser) {
        await this.alertService.createUserNotification(
          event.userId,
          'UNUSUAL_ACTIVITY',
          anomalies,
          totalRiskScore
        );
      }

      const result: AnomalyAnalysisResult = {
        isAnomalous: anomalies.length > 0,
        totalRiskScore,
        anomalies,
        recommendations,
        shouldAlert,
        shouldNotifyUser,
      };

      // Log analysis result
      if (anomalies.length > 0) {
        console.log('[AnomalyDetectionService] Transaction anomalies detected:', {
          userId: event.userId,
          transactionId: event.transactionId,
          anomalyCount: anomalies.length,
          totalRiskScore,
          durationMs: Date.now() - startTime,
        });
      }

      return result;
    } catch (error) {
      console.error(
        '[AnomalyDetectionService] Error analyzing transaction:',
        error
      );

      return {
        isAnomalous: false,
        totalRiskScore: 0,
        anomalies: [],
        recommendations: [],
        shouldAlert: false,
        shouldNotifyUser: false,
      };
    }
  }

  /**
   * Get user's security alerts
   */
  async getUserAlerts(userId: string, limit = 10) {
    return this.alertService.getUserAlerts(userId, limit);
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, limit = 20) {
    return this.alertService.getUserNotifications(userId, limit);
  }

  /**
   * Acknowledge a security alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    return this.alertService.acknowledgeAlert(alertId, acknowledgedBy);
  }

  /**
   * Get user's login pattern for review
   */
  async getLoginPattern(userId: string) {
    return this.loginAnalyzer.getLoginPattern(userId);
  }

  /**
   * Get user's transaction pattern for review
   */
  async getTransactionPattern(userId: string) {
    return this.transactionDetector.getTransactionPattern(userId);
  }

  /**
   * Look up geographic location for an IP
   */
  lookupIP(ip: string) {
    return this.geoIP.lookup(ip);
  }

  /**
   * Calculate total risk score from anomalies
   * Uses weighted sum with diminishing returns for multiple anomalies
   */
  private calculateTotalRiskScore(anomalies: Anomaly[]): number {
    if (anomalies.length === 0) {
      return 0;
    }

    // Sort by risk score descending
    const sorted = [...anomalies].sort((a, b) => b.riskScore - a.riskScore);

    // Apply diminishing returns for multiple anomalies
    // First anomaly counts 100%, second 80%, third 60%, etc.
    let total = 0;
    let multiplier = 1;

    for (const anomaly of sorted) {
      total += anomaly.riskScore * multiplier;
      multiplier = Math.max(0.2, multiplier - 0.2);
    }

    // Cap at 100
    return Math.min(100, Math.round(total));
  }

  /**
   * Generate recommendations based on detected anomalies
   *
   * @param anomalies - Detected anomalies
   * @param eventType - Type of event being analyzed
   * @param totalRiskScore - Pre-calculated total risk score (using diminishing returns)
   */
  private generateRecommendations(
    anomalies: Anomaly[],
    eventType: 'LOGIN' | 'TRANSACTION',
    totalRiskScore?: number
  ): string[] {
    const recommendations: string[] = [];

    const anomalyTypes = new Set(anomalies.map((a) => a.type));

    // Location-based recommendations
    if (anomalyTypes.has('NEW_COUNTRY') || anomalyTypes.has('IMPOSSIBLE_TRAVEL')) {
      recommendations.push(
        'Verify this activity with the user through a secondary channel'
      );
      recommendations.push('Consider requiring additional authentication');
    }

    if (anomalyTypes.has('NEW_CITY')) {
      recommendations.push(
        'Monitor for additional suspicious activity from this user'
      );
    }

    // Time-based recommendations
    if (anomalyTypes.has('UNUSUAL_TIME')) {
      recommendations.push(
        'This login occurred outside the user\'s typical hours'
      );
    }

    // Multiple IP recommendations
    if (anomalyTypes.has('MULTIPLE_IPS')) {
      recommendations.push(
        'Multiple IPs detected - possible session hijacking or VPN usage'
      );
    }

    // Transaction-specific recommendations
    if (eventType === 'TRANSACTION') {
      if (anomalyTypes.has('UNUSUAL_AMOUNT')) {
        recommendations.push(
          'Consider requiring manual approval for this transaction'
        );
        recommendations.push(
          'Verify with the user that this transaction amount is intended'
        );
      }

      if (anomalyTypes.has('HIGH_FREQUENCY')) {
        recommendations.push(
          'High transaction velocity detected - review for potential fraud'
        );
      }
    }

    // Failed attempts recommendations
    if (anomalyTypes.has('FAILED_ATTEMPTS')) {
      recommendations.push(
        'Multiple failed login attempts before success - possible credential stuffing'
      );
    }

    // General recommendations for high-risk situations
    // Use the pre-calculated totalRiskScore (with diminishing returns) if provided,
    // otherwise calculate it using the canonical method
    const effectiveRiskScore =
      totalRiskScore ?? this.calculateTotalRiskScore(anomalies);
    if (effectiveRiskScore >= 70) {
      recommendations.push('Consider temporarily restricting account access');
      recommendations.push('Review all recent account activity');
    }

    return recommendations;
  }
}

/**
 * Factory function to create an anomaly detection service with environment configuration
 */
export function createAnomalyDetectionService(
  redis: Redis | null,
  emailService?: EmailService
): AnomalyDetectionService {
  // Helper to safely parse integers with fallback defaults
  const parseIntWithDefault = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  };

  const config: Partial<AnomalyDetectionConfig> = {
    geoIPEnabled: process.env.ANOMALY_GEO_ENABLED !== 'false',
    timePatternEnabled: process.env.ANOMALY_TIME_ENABLED !== 'false',
    transactionAnalysisEnabled: process.env.ANOMALY_TRANSACTION_ENABLED !== 'false',
    alertRiskThreshold: parseIntWithDefault(process.env.ANOMALY_ALERT_THRESHOLD, 70),
    userNotificationRiskThreshold: parseIntWithDefault(
      process.env.ANOMALY_USER_NOTIFY_THRESHOLD,
      50
    ),
  };

  const alertConfig = {
    riskThreshold: config.alertRiskThreshold,
    userNotificationThreshold: config.userNotificationRiskThreshold,
    enableSlack: !!process.env.ANOMALY_SLACK_WEBHOOK,
    slackWebhookUrl: process.env.ANOMALY_SLACK_WEBHOOK,
    enableEmail: !!emailService && !!process.env.ANOMALY_ADMIN_EMAILS,
    adminEmails: (process.env.ANOMALY_ADMIN_EMAILS || '').split(',').filter(Boolean),
  };

  return new AnomalyDetectionService({
    redis,
    config,
    emailService,
    alertConfig,
  });
}
