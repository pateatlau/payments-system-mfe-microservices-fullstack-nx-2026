/**
 * Security Library Types
 *
 * Type definitions for anomaly detection and security monitoring
 */

/**
 * Geographic location information
 */
export interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

/**
 * Login event data for anomaly analysis
 */
export interface LoginEvent {
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  email?: string;
}

/**
 * Transaction event data for anomaly analysis
 */
export interface TransactionEvent {
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  type: 'PAYMENT' | 'REFUND' | 'TRANSFER';
  timestamp: Date;
  recipientId?: string;
}

/**
 * Types of anomalies that can be detected
 */
export type AnomalyType =
  | 'NEW_COUNTRY'
  | 'NEW_CITY'
  | 'UNUSUAL_TIME'
  | 'MULTIPLE_IPS'
  | 'IMPOSSIBLE_TRAVEL'
  | 'UNUSUAL_AMOUNT'
  | 'HIGH_FREQUENCY'
  | 'NEW_DEVICE'
  | 'FAILED_ATTEMPTS';

/**
 * Severity levels for anomalies
 */
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Individual anomaly detection result
 */
export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  riskScore: number;
  description: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Result of analyzing an event for anomalies
 */
export interface AnomalyAnalysisResult {
  isAnomalous: boolean;
  totalRiskScore: number;
  anomalies: Anomaly[];
  recommendations: string[];
  shouldAlert: boolean;
  shouldNotifyUser: boolean;
}

/**
 * User's historical login pattern
 */
export interface LoginPattern {
  userId: string;
  typicalHours: number[]; // 0-23
  typicalDays: number[]; // 0-6 (Sun-Sat)
  knownCountries: string[];
  knownCities: string[];
  knownIPs: string[];
  averageLoginFrequency: number; // logins per day
  lastUpdated: Date;
}

/**
 * User's historical transaction pattern
 */
export interface TransactionPattern {
  userId: string;
  averageAmount: number;
  maxAmount: number;
  typicalAmounts: number[]; // histogram buckets
  averageFrequency: number; // transactions per day
  typicalRecipients: string[];
  lastUpdated: Date;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  riskThreshold: number;
  userNotificationThreshold: number;
  enableEmail: boolean;
  enableSlack: boolean;
  slackWebhookUrl?: string;
  adminEmails: string[];
}

/**
 * Alert payload
 */
export interface SecurityAlert {
  id: string;
  userId: string;
  eventType: 'LOGIN' | 'TRANSACTION';
  anomalies: Anomaly[];
  totalRiskScore: number;
  timestamp: Date;
  location?: GeoLocation;
  ip?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * User notification payload
 */
export interface UserNotification {
  userId: string;
  type: 'SECURITY_ALERT' | 'NEW_LOGIN' | 'UNUSUAL_ACTIVITY';
  title: string;
  message: string;
  severity: AnomalySeverity;
  actionRequired: boolean;
  actionUrl?: string;
  timestamp: Date;
}

/**
 * Configuration for anomaly detection service
 */
export interface AnomalyDetectionConfig {
  // Feature flags
  geoIPEnabled: boolean;
  timePatternEnabled: boolean;
  transactionAnalysisEnabled: boolean;

  // Thresholds
  alertRiskThreshold: number;
  userNotificationRiskThreshold: number;

  // Risk scores for each anomaly type
  riskScores: Record<AnomalyType, number>;

  // Time pattern settings
  unusualHourWindow: number; // hours outside typical pattern to flag
  multipleIPWindow: number; // seconds to check for multiple IPs

  // Transaction settings
  amountDeviationThreshold: number; // standard deviations from mean
  frequencyDeviationThreshold: number; // multiplier of average frequency

  // History settings
  loginHistoryDays: number;
  transactionHistoryDays: number;
}

/**
 * Default risk scores for anomaly types
 */
export const DEFAULT_RISK_SCORES: Record<AnomalyType, number> = {
  NEW_COUNTRY: 30,
  NEW_CITY: 15,
  UNUSUAL_TIME: 20,
  MULTIPLE_IPS: 25,
  IMPOSSIBLE_TRAVEL: 50,
  UNUSUAL_AMOUNT: 35,
  HIGH_FREQUENCY: 25,
  NEW_DEVICE: 15,
  FAILED_ATTEMPTS: 20,
};

/**
 * Default anomaly detection configuration
 */
export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  geoIPEnabled: true,
  timePatternEnabled: true,
  transactionAnalysisEnabled: true,
  alertRiskThreshold: 70,
  userNotificationRiskThreshold: 50,
  riskScores: DEFAULT_RISK_SCORES,
  unusualHourWindow: 3,
  multipleIPWindow: 300, // 5 minutes
  amountDeviationThreshold: 2.5,
  frequencyDeviationThreshold: 3,
  loginHistoryDays: 30,
  transactionHistoryDays: 90,
};
