# Security Library

Backend security utilities for anomaly detection and threat monitoring.

## Features

- **GeoIP Detection**: Identify login locations and detect unusual geographic activity
- **Login Time Pattern Analysis**: Detect logins at unusual times for users
- **Transaction Anomaly Detection**: Flag unusual payment amounts and patterns
- **Alerting**: Notify administrators of suspicious activity
- **User Notifications**: Inform users of unusual activity on their accounts

## Usage

```typescript
import {
  AnomalyDetectionService,
  GeoIPService,
  LoginPatternAnalyzer,
  TransactionAnomalyDetector,
  AlertService,
} from '@payments-system/security';

// Initialize services
const geoIP = new GeoIPService();
const loginPatterns = new LoginPatternAnalyzer(redisClient);
const transactionDetector = new TransactionAnomalyDetector(redisClient);
const alertService = new AlertService();

const anomalyService = new AnomalyDetectionService({
  geoIP,
  loginPatterns,
  transactionDetector,
  alertService,
});

// Check login for anomalies
const result = await anomalyService.analyzeLogin({
  userId: 'user-123',
  ip: '203.0.113.42',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date(),
});

if (result.isAnomalous) {
  console.log('Anomalies detected:', result.anomalies);
}
```

## Configuration

Environment variables:

- `ANOMALY_GEO_ENABLED`: Enable GeoIP detection (default: true)
- `ANOMALY_TIME_ENABLED`: Enable login time analysis (default: true)
- `ANOMALY_TRANSACTION_ENABLED`: Enable transaction analysis (default: true)
- `ANOMALY_ALERT_THRESHOLD`: Risk score threshold for alerts (default: 70)

## Risk Scoring

Each anomaly type contributes to a risk score:

| Anomaly Type | Risk Points |
|--------------|-------------|
| New country | 30 |
| New city (same country) | 15 |
| Unusual login time | 20 |
| Multiple IPs in short time | 25 |
| Unusual transaction amount | 35 |
| High transaction frequency | 25 |

Total risk score > 70 triggers administrator alerts.
Total risk score > 50 triggers user notifications.
