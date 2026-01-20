/**
 * Backend Security Library
 *
 * Provides security features for:
 * - Anomaly detection (login patterns, GeoIP, transactions)
 * - Session management (concurrent limits, activity tracking)
 * - Device fingerprinting
 * - Security alerting and user notifications
 */

// ============================================================
// Anomaly Detection
// ============================================================

// Main anomaly detection service
export {
  AnomalyDetectionService,
  createAnomalyDetectionService,
  type AnomalyDetectionServiceConfig,
} from './lib/anomaly-detection-service';

// Anomaly detection component services
export { GeoIPService } from './lib/geoip';
export { LoginPatternAnalyzer } from './lib/login-pattern-analyzer';
export { TransactionAnomalyDetector } from './lib/transaction-anomaly-detector';
export { AlertService, type EmailService } from './lib/alert-service';

// Anomaly detection types
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

// Anomaly detection constants
export { DEFAULT_RISK_SCORES, DEFAULT_ANOMALY_CONFIG } from './lib/types';

// ============================================================
// Session Management (Priority 7.3)
// ============================================================

// Session manager service
export {
  SessionManager,
  createSessionManager,
} from './lib/session-manager';

// Device fingerprinting service
export {
  DeviceFingerprintService,
  getDeviceFingerprintService,
} from './lib/device-fingerprint';

// Session management types
export type {
  DeviceFingerprint,
  Session,
  SessionActivity,
  SessionActivityType,
  SessionConfig,
  SessionValidationResult,
  SessionInvalidReason,
  ForceLogoutOptions,
  ForceLogoutResult,
  SessionListResponse,
  SessionInfo,
  SessionRequestContext,
  CreateSessionResult,
} from './lib/session-types';

// Session management constants
export { DEFAULT_SESSION_CONFIG } from './lib/session-types';
