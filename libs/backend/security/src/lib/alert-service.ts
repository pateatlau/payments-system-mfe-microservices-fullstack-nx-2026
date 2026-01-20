/**
 * Alert Service
 *
 * Handles security alert notifications:
 * - Admin alerts for suspicious activity
 * - User notifications for unusual activity
 * - Slack/webhook integration
 * - Email notifications (interface only, requires external email service)
 *
 * Uses Redis for alert storage and deduplication
 */

import type Redis from 'ioredis';

// Lazy load crypto module for compatibility
let cryptoModule: typeof import('crypto') | null = null;
function getCrypto(): typeof import('crypto') | null {
  if (cryptoModule === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cryptoModule = require('crypto');
    } catch {
      cryptoModule = null;
    }
  }
  return cryptoModule;
}
import type {
  SecurityAlert,
  UserNotification,
  Anomaly,
  AlertConfig,
  GeoLocation,
  AnomalySeverity,
} from './types';

/**
 * Redis key prefixes for alert storage
 */
const REDIS_KEYS = {
  ALERTS: 'security:alerts:', // {alertId}
  USER_ALERTS: 'security:user_alerts:', // {userId}
  ALERT_DEDUPE: 'security:alert_dedupe:', // {userId}:{anomalyType}
  USER_NOTIFICATIONS: 'security:user_notifications:', // {userId}
};

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  riskThreshold: 70,
  userNotificationThreshold: 50,
  enableEmail: false,
  enableSlack: false,
  slackWebhookUrl: undefined,
  adminEmails: [],
};

/**
 * Email notification interface
 * Services implementing this interface can be injected for email sending
 */
export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

/**
 * Alert Service for security notifications
 */
export class AlertService {
  private redis: Redis | null;
  private config: AlertConfig;
  private emailService: EmailService | null;

  constructor(
    redis: Redis | null = null,
    config?: Partial<AlertConfig>,
    emailService?: EmailService
  ) {
    this.redis = redis;
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
    this.emailService = emailService || null;
  }

  /**
   * Create and send security alert to admins
   *
   * @param userId - User ID involved in the alert
   * @param eventType - Type of event (LOGIN or TRANSACTION)
   * @param anomalies - List of detected anomalies
   * @param totalRiskScore - Combined risk score
   * @param location - Geographic location if available
   * @param ip - IP address if available
   * @returns SecurityAlert if created, null if deduplicated
   */
  async createAlert(
    userId: string,
    eventType: 'LOGIN' | 'TRANSACTION',
    anomalies: Anomaly[],
    totalRiskScore: number,
    location?: GeoLocation | null,
    ip?: string
  ): Promise<SecurityAlert | null> {
    // Check if alert should be created based on risk threshold
    if (totalRiskScore < this.config.riskThreshold) {
      return null;
    }

    // Check for deduplication (same user + anomaly type within 1 hour)
    const isDuplicate = await this.checkDuplicate(userId, anomalies);
    if (isDuplicate) {
      console.log(
        `[AlertService] Alert deduplicated for user ${userId}, skipping`
      );
      return null;
    }

    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      userId,
      eventType,
      anomalies,
      totalRiskScore,
      timestamp: new Date(),
      location: location || undefined,
      ip,
      acknowledged: false,
    };

    // Store alert in Redis
    await this.storeAlert(alert);

    // Send notifications
    await this.sendAdminNotifications(alert);

    // Log the alert
    console.log(`[AlertService] Security alert created:`, {
      alertId: alert.id,
      userId,
      eventType,
      riskScore: totalRiskScore,
      anomalyCount: anomalies.length,
    });

    return alert;
  }

  /**
   * Create user notification for unusual activity
   *
   * @param userId - User ID to notify
   * @param type - Notification type
   * @param anomalies - List of detected anomalies
   * @param totalRiskScore - Combined risk score
   * @returns UserNotification if created
   */
  async createUserNotification(
    userId: string,
    type: 'SECURITY_ALERT' | 'NEW_LOGIN' | 'UNUSUAL_ACTIVITY',
    anomalies: Anomaly[],
    totalRiskScore: number
  ): Promise<UserNotification | null> {
    // Check if notification should be created
    if (totalRiskScore < this.config.userNotificationThreshold) {
      return null;
    }

    const severity = this.determineSeverity(totalRiskScore);
    const { title, message, actionRequired, actionUrl } = this.buildNotificationContent(
      type,
      anomalies,
      severity
    );

    const notification: UserNotification = {
      userId,
      type,
      title,
      message,
      severity,
      actionRequired,
      actionUrl,
      timestamp: new Date(),
    };

    // Store notification in Redis
    await this.storeUserNotification(notification);

    // Log the notification
    console.log(`[AlertService] User notification created:`, {
      userId,
      type,
      severity,
      actionRequired,
    });

    return notification;
  }

  /**
   * Get recent alerts for a user
   */
  async getUserAlerts(
    userId: string,
    limit = 10
  ): Promise<SecurityAlert[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const key = REDIS_KEYS.USER_ALERTS + userId;
      const alertIds = await this.redis.lrange(key, 0, limit - 1);

      const alerts: SecurityAlert[] = [];
      for (const alertId of alertIds) {
        const alertKey = REDIS_KEYS.ALERTS + alertId;
        const alertData = await this.redis.get(alertKey);
        if (alertData) {
          alerts.push(JSON.parse(alertData) as SecurityAlert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('[AlertService] Error getting user alerts:', error);
      return [];
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit = 20
  ): Promise<UserNotification[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const key = REDIS_KEYS.USER_NOTIFICATIONS + userId;
      const notifications = await this.redis.lrange(key, 0, limit - 1);

      return notifications.map((n) => JSON.parse(n) as UserNotification);
    } catch (error) {
      console.error('[AlertService] Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const key = REDIS_KEYS.ALERTS + alertId;
      const alertData = await this.redis.get(key);

      if (!alertData) {
        return false;
      }

      const alert = JSON.parse(alertData) as SecurityAlert;
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();

      await this.redis.set(key, JSON.stringify(alert));

      console.log(`[AlertService] Alert ${alertId} acknowledged by ${acknowledgedBy}`);
      return true;
    } catch (error) {
      console.error('[AlertService] Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Check if similar alert was recently created (deduplication)
   */
  private async checkDuplicate(
    userId: string,
    anomalies: Anomaly[]
  ): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      // Create a key based on user + anomaly types
      const anomalyTypes = anomalies
        .map((a) => a.type)
        .sort()
        .join(':');
      const dedupeKey = REDIS_KEYS.ALERT_DEDUPE + userId + ':' + anomalyTypes;

      // Check if key exists
      const exists = await this.redis.exists(dedupeKey);
      if (exists) {
        return true;
      }

      // Set key with 1 hour expiry
      await this.redis.set(dedupeKey, '1', 'EX', 3600);
      return false;
    } catch (error) {
      console.error('[AlertService] Error checking duplicate:', error);
      return false;
    }
  }

  /**
   * Store alert in Redis
   */
  private async storeAlert(alert: SecurityAlert): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      // Store the alert
      const alertKey = REDIS_KEYS.ALERTS + alert.id;
      await this.redis.set(
        alertKey,
        JSON.stringify(alert),
        'EX',
        30 * 24 * 3600 // 30 days
      );

      // Add to user's alert list
      const userKey = REDIS_KEYS.USER_ALERTS + alert.userId;
      await this.redis.lpush(userKey, alert.id);
      await this.redis.ltrim(userKey, 0, 99); // Keep last 100
      await this.redis.expire(userKey, 30 * 24 * 3600);
    } catch (error) {
      console.error('[AlertService] Error storing alert:', error);
    }
  }

  /**
   * Store user notification in Redis
   */
  private async storeUserNotification(
    notification: UserNotification
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const key = REDIS_KEYS.USER_NOTIFICATIONS + notification.userId;
      await this.redis.lpush(key, JSON.stringify(notification));
      await this.redis.ltrim(key, 0, 99); // Keep last 100
      await this.redis.expire(key, 30 * 24 * 3600); // 30 days
    } catch (error) {
      console.error('[AlertService] Error storing notification:', error);
    }
  }

  /**
   * Send notifications to admins
   */
  private async sendAdminNotifications(alert: SecurityAlert): Promise<void> {
    // Send Slack notification if configured
    if (this.config.enableSlack && this.config.slackWebhookUrl) {
      await this.sendSlackNotification(alert);
    }

    // Send email notifications if configured
    if (this.config.enableEmail && this.emailService && this.config.adminEmails.length > 0) {
      await this.sendEmailNotifications(alert);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: SecurityAlert): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      return;
    }

    try {
      const severity = this.determineSeverity(alert.totalRiskScore);
      const emoji = this.getSeverityEmoji(severity);

      const payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} Security Alert - ${alert.eventType}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*User ID:*\n${alert.userId}`,
              },
              {
                type: 'mrkdwn',
                text: `*Risk Score:*\n${alert.totalRiskScore}`,
              },
              {
                type: 'mrkdwn',
                text: `*IP Address:*\n${alert.ip || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Location:*\n${alert.location ? `${alert.location.city}, ${alert.location.country}` : 'Unknown'}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Detected Anomalies:*\n${alert.anomalies.map((a) => `• ${a.description}`).join('\n')}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Alert ID: ${alert.id} | Time: ${alert.timestamp.toISOString()}`,
              },
            ],
          },
        ],
      };

      // Use AbortController for timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutMs = 5000; // 5 second timeout
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(this.config.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(
            '[AlertService] Slack notification failed:',
            response.status
          );
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(
            `[AlertService] Slack notification timed out after ${timeoutMs}ms`
          );
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('[AlertService] Error sending Slack notification:', error);
    }
  }

  /**
   * Send email notifications to admins
   */
  private async sendEmailNotifications(alert: SecurityAlert): Promise<void> {
    if (!this.emailService) {
      return;
    }

    const severity = this.determineSeverity(alert.totalRiskScore);
    const subject = `[${severity}] Security Alert - ${alert.eventType} for user ${alert.userId}`;
    const body = this.buildEmailBody(alert);

    for (const email of this.config.adminEmails) {
      try {
        await this.emailService.sendEmail(email, subject, body);
      } catch (error) {
        console.error(
          `[AlertService] Error sending email to ${email}:`,
          error
        );
      }
    }
  }

  /**
   * Build email body for alert
   */
  private buildEmailBody(alert: SecurityAlert): string {
    const lines = [
      `Security Alert - ${alert.eventType}`,
      '',
      `User ID: ${alert.userId}`,
      `Risk Score: ${alert.totalRiskScore}`,
      `IP Address: ${alert.ip || 'Unknown'}`,
      `Location: ${alert.location ? `${alert.location.city}, ${alert.location.country}` : 'Unknown'}`,
      `Time: ${alert.timestamp.toISOString()}`,
      '',
      'Detected Anomalies:',
      ...alert.anomalies.map(
        (a) => `- [${a.severity}] ${a.type}: ${a.description}`
      ),
      '',
      `Alert ID: ${alert.id}`,
    ];

    return lines.join('\n');
  }

  /**
   * Build notification content for user
   */
  private buildNotificationContent(
    type: 'SECURITY_ALERT' | 'NEW_LOGIN' | 'UNUSUAL_ACTIVITY',
    anomalies: Anomaly[],
    severity: AnomalySeverity
  ): {
    title: string;
    message: string;
    actionRequired: boolean;
    actionUrl?: string;
  } {
    switch (type) {
      case 'SECURITY_ALERT':
        return {
          title: 'Security Alert',
          message: `We detected unusual activity on your account: ${anomalies.map((a) => a.description).join('; ')}. If this wasn't you, please secure your account immediately.`,
          actionRequired: severity === 'HIGH' || severity === 'CRITICAL',
          actionUrl: '/account/security',
        };

      case 'NEW_LOGIN':
        return {
          title: 'New Login Detected',
          message: `A new login was detected from ${anomalies[0]?.details?.city || 'an unknown location'}. If this wasn't you, please change your password.`,
          actionRequired: false,
          actionUrl: '/account/sessions',
        };

      case 'UNUSUAL_ACTIVITY':
        return {
          title: 'Unusual Activity Detected',
          message: `We noticed some unusual activity on your account. Please review your recent activity to ensure everything looks correct.`,
          actionRequired: false,
          actionUrl: '/account/activity',
        };

      default:
        return {
          title: 'Account Notification',
          message: 'Please check your account for recent activity.',
          actionRequired: false,
        };
    }
  }

  /**
   * Determine severity level from risk score
   */
  private determineSeverity(riskScore: number): AnomalySeverity {
    if (riskScore >= 90) return 'CRITICAL';
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get emoji for severity level (for Slack)
   */
  private getSeverityEmoji(severity: AnomalySeverity): string {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return 'ℹ️';
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    const crypto = getCrypto();
    const randomPart = crypto
      ? crypto.randomBytes(4).toString('hex')
      : Math.random().toString(36).substring(2, 10);
    return `alert_${Date.now()}_${randomPart}`;
  }
}
