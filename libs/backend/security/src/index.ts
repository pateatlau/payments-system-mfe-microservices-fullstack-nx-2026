/**
 * Backend Security Library
 *
 * Provides anomaly detection and security monitoring for:
 * - Login pattern analysis
 * - GeoIP location detection
 * - Transaction anomaly detection
 * - Security alerting
 * - User notifications
 */

// Main service
export {
  AnomalyDetectionService,
  createAnomalyDetectionService,
  type AnomalyDetectionServiceConfig,
} from './lib/anomaly-detection-service';

// Component services
export { GeoIPService } from './lib/geoip';
export { LoginPatternAnalyzer } from './lib/login-pattern-analyzer';
export { TransactionAnomalyDetector } from './lib/transaction-anomaly-detector';
export { AlertService, type EmailService } from './lib/alert-service';

// Types
export type {
  GeoLocation,
  LoginEvent,
  TransactionEvent,
  AnomalyType,
  AnomalySeverity,
  Anomaly,
  AnomalyAnalysisResult,
  LoginPattern,
  TransactionPattern,
  AlertConfig,
  SecurityAlert,
  UserNotification,
  AnomalyDetectionConfig,
} from './lib/types';

// Constants
export { DEFAULT_RISK_SCORES, DEFAULT_ANOMALY_CONFIG } from './lib/types';
