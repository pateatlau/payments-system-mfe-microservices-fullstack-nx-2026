# Anomaly Detection System - Manual Testing Guide

This document provides detailed instructions for manually testing all anomaly detection scenarios implemented in Priority 7.2.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Testing GeoIP Service](#testing-geoip-service)
4. [Testing Login Pattern Analyzer](#testing-login-pattern-analyzer)
5. [Testing Transaction Anomaly Detector](#testing-transaction-anomaly-detector)
6. [Testing Alert Service](#testing-alert-service)
7. [Testing Anomaly Detection Service](#testing-anomaly-detection-service)
8. [Integration Testing](#integration-testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **Redis** - Required for pattern storage and alert deduplication
2. **PostgreSQL** - Required for user data (auth-service, payments-service)
3. **Backend Services** - API Gateway, Auth Service, Payments Service

### Optional Dependencies

1. **geoip-lite** - For GeoIP location lookup (install with `pnpm add geoip-lite`)
2. **Slack Workspace** - For testing Slack webhook alerts
3. **Email Service** - For testing email notifications

### Start Infrastructure

```bash
# Start all infrastructure
pnpm infra:start

# Start backend services
pnpm dev:backend

# Verify Redis is running
pnpm redis:keys
```

---

## Test Environment Setup

### 1. Create Test Script

Create a test script at `scripts/test-anomaly-detection.ts`:

```typescript
import Redis from 'ioredis';
import {
  createAnomalyDetectionService,
  GeoIPService,
  LoginPatternAnalyzer,
  TransactionAnomalyDetector,
  AlertService,
} from '@payments-system/security';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Test utilities
async function clearTestData(userId: string) {
  const keys = await redis.keys(`*${userId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  console.log(`Cleared ${keys.length} Redis keys for user ${userId}`);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export for use in test scenarios
export { redis, clearTestData, sleep };
```

### 2. Environment Variables

Set up environment variables for testing:

```bash
# .env.test
REDIS_URL=redis://localhost:6379
ANOMALY_GEO_ENABLED=true
ANOMALY_TIME_ENABLED=true
ANOMALY_TRANSACTION_ENABLED=true
ANOMALY_ALERT_THRESHOLD=70
ANOMALY_USER_NOTIFY_THRESHOLD=50
ANOMALY_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ANOMALY_ADMIN_EMAILS=admin@example.com
```

---

## Testing GeoIP Service

### Test 1: Private IP Detection

**Objective:** Verify that private/local IPs are correctly identified.

**Steps:**

```typescript
import { GeoIPService } from '@payments-system/security';

const geoIP = new GeoIPService();

// Test private IPs
const privateIPs = [
  '127.0.0.1',      // Localhost
  '192.168.1.1',    // RFC1918 Class C
  '10.0.0.1',       // RFC1918 Class A
  '172.16.0.1',     // RFC1918 Class B
  '169.254.1.1',    // Link-local
  '::1',            // IPv6 localhost
];

console.log('=== Private IP Detection Test ===');
privateIPs.forEach((ip) => {
  const isPrivate = geoIP.isPrivateIP(ip);
  console.log(`${ip}: ${isPrivate ? 'PRIVATE' : 'PUBLIC'}`);
});
```

**Expected Results:**
- All listed IPs should return `true` for `isPrivateIP()`
- Private IPs should return `null` from `lookup()`

---

### Test 2: Public IP Location Lookup

**Objective:** Verify GeoIP location lookup for public IPs.

**Prerequisites:** `geoip-lite` must be installed.

**Steps:**

```typescript
import { GeoIPService } from '@payments-system/security';

const geoIP = new GeoIPService();

// Test public IPs (Google, Cloudflare, etc.)
const publicIPs = [
  { ip: '8.8.8.8', expected: 'US' },        // Google DNS
  { ip: '1.1.1.1', expected: 'AU' },        // Cloudflare
  { ip: '208.67.222.222', expected: 'US' }, // OpenDNS
  { ip: '185.199.108.153', expected: 'US' }, // GitHub
];

console.log('=== Public IP Location Lookup Test ===');
publicIPs.forEach(({ ip, expected }) => {
  const location = geoIP.lookup(ip);
  if (location) {
    console.log(`${ip}: ${location.city}, ${location.country} (${location.countryCode})`);
    console.log(`  Expected country: ${expected}, Got: ${location.countryCode}`);
  } else {
    console.log(`${ip}: No location data (GeoIP may not be installed)`);
  }
});
```

**Expected Results:**
- Each IP should return location data with country, city, coordinates
- If `geoip-lite` is not installed, all lookups return `null`

---

### Test 3: Distance Calculation

**Objective:** Verify distance calculation between two locations.

**Steps:**

```typescript
import { GeoIPService } from '@payments-system/security';

const geoIP = new GeoIPService();

// Known distances (approximate)
const testCases = [
  {
    from: { latitude: 40.7128, longitude: -74.0060 },  // New York
    to: { latitude: 51.5074, longitude: -0.1278 },     // London
    expectedKm: 5570,
    tolerance: 100,
  },
  {
    from: { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
    to: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    expectedKm: 8280,
    tolerance: 100,
  },
  {
    from: { latitude: 40.7128, longitude: -74.0060 }, // New York
    to: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
    expectedKm: 3940,
    tolerance: 100,
  },
];

console.log('=== Distance Calculation Test ===');
testCases.forEach(({ from, to, expectedKm, tolerance }) => {
  const distance = geoIP.calculateDistance(from, to);
  const withinTolerance = Math.abs(distance - expectedKm) <= tolerance;
  console.log(`Distance: ${distance.toFixed(0)} km (expected ~${expectedKm} km)`);
  console.log(`  Status: ${withinTolerance ? 'PASS' : 'FAIL'}`);
});
```

**Expected Results:**
- Distances should be within tolerance of expected values
- Haversine formula should produce accurate great-circle distances

---

### Test 4: Impossible Travel Detection

**Objective:** Verify impossible travel detection based on distance and time.

**Steps:**

```typescript
import { GeoIPService } from '@payments-system/security';

const geoIP = new GeoIPService();

const newYork = { latitude: 40.7128, longitude: -74.0060 };
const london = { latitude: 51.5074, longitude: -0.1278 };
const losAngeles = { latitude: 34.0522, longitude: -118.2437 };

console.log('=== Impossible Travel Detection Test ===');

// Scenario 1: New York to London in 30 minutes (IMPOSSIBLE)
const impossible1 = geoIP.isImpossibleTravel(newYork, london, 30);
console.log(`NY -> London in 30 min: ${impossible1 ? 'IMPOSSIBLE' : 'POSSIBLE'}`);

// Scenario 2: New York to London in 8 hours (POSSIBLE - flight time)
const possible1 = geoIP.isImpossibleTravel(newYork, london, 480);
console.log(`NY -> London in 8 hours: ${possible1 ? 'IMPOSSIBLE' : 'POSSIBLE'}`);

// Scenario 3: New York to LA in 1 hour (IMPOSSIBLE)
const impossible2 = geoIP.isImpossibleTravel(newYork, losAngeles, 60);
console.log(`NY -> LA in 1 hour: ${impossible2 ? 'IMPOSSIBLE' : 'POSSIBLE'}`);

// Scenario 4: New York to LA in 6 hours (POSSIBLE - flight time)
const possible2 = geoIP.isImpossibleTravel(newYork, losAngeles, 360);
console.log(`NY -> LA in 6 hours: ${possible2 ? 'IMPOSSIBLE' : 'POSSIBLE'}`);
```

**Expected Results:**
- Short time + long distance = IMPOSSIBLE
- Adequate time for flight = POSSIBLE
- Default max speed is 900 km/h (commercial flight speed)

---

## Testing Login Pattern Analyzer

### Test 5: Unusual Login Time Detection

**Objective:** Verify detection of logins at unusual hours.

**Steps:**

```typescript
import Redis from 'ioredis';
import { LoginPatternAnalyzer, GeoIPService } from '@payments-system/security';

const redis = new Redis();
const geoIP = new GeoIPService();
const analyzer = new LoginPatternAnalyzer(redis, geoIP);

const userId = 'test-user-time-001';

// Clear previous test data
await redis.del(`login:pattern:${userId}`);
await redis.del(`login:history:${userId}`);

console.log('=== Unusual Login Time Detection Test ===');

// Step 1: Establish normal pattern (business hours 9-17)
console.log('Step 1: Establishing normal login pattern...');
const normalHours = [9, 10, 11, 14, 15, 16];
for (const hour of normalHours) {
  const timestamp = new Date();
  timestamp.setUTCHours(hour, 0, 0, 0);

  await analyzer.analyzeLogin({
    userId,
    ip: '192.168.1.100', // Private IP to avoid GeoIP checks
    userAgent: 'Mozilla/5.0 Test',
    timestamp,
    success: true,
  });
  console.log(`  Logged in at ${hour}:00 UTC`);
}

// Step 2: Login at unusual time (3 AM)
console.log('\nStep 2: Testing login at unusual time (3 AM)...');
const unusualTime = new Date();
unusualTime.setUTCHours(3, 0, 0, 0);

const result = await analyzer.analyzeLogin({
  userId,
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0 Test',
  timestamp: unusualTime,
  success: true,
});

console.log('\nAnomalies detected:');
result.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
});

const unusualTimeAnomaly = result.find((a) => a.type === 'UNUSUAL_TIME');
console.log(`\nUnusual time detected: ${unusualTimeAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- After establishing pattern, 3 AM login should trigger `UNUSUAL_TIME` anomaly
- Severity should be `MEDIUM`
- Risk score should be 15 (default)

---

### Test 6: New Country Detection

**Objective:** Verify detection of logins from new countries.

**Prerequisites:** `geoip-lite` must be installed for full functionality.

**Steps:**

```typescript
import Redis from 'ioredis';
import { LoginPatternAnalyzer, GeoIPService } from '@payments-system/security';

const redis = new Redis();
const geoIP = new GeoIPService();
const analyzer = new LoginPatternAnalyzer(redis, geoIP);

const userId = 'test-user-country-001';

// Clear previous test data
await redis.del(`login:pattern:${userId}`);
await redis.del(`login:history:${userId}`);

console.log('=== New Country Detection Test ===');

// Step 1: Establish pattern with US logins
console.log('Step 1: Establishing US login pattern...');
const usIPs = ['8.8.8.8', '8.8.4.4', '208.67.222.222'];
for (const ip of usIPs) {
  await analyzer.analyzeLogin({
    userId,
    ip,
    userAgent: 'Mozilla/5.0 Test',
    timestamp: new Date(),
    success: true,
  });
  const location = geoIP.lookup(ip);
  console.log(`  Logged in from ${ip} (${location?.country || 'Unknown'})`);
}

// Step 2: Login from different country (Germany)
console.log('\nStep 2: Testing login from Germany...');
// Using a known German IP (Deutsche Telekom)
const germanIP = '91.64.0.1';

const result = await analyzer.analyzeLogin({
  userId,
  ip: germanIP,
  userAgent: 'Mozilla/5.0 Test',
  timestamp: new Date(),
  success: true,
});

console.log('\nAnomalies detected:');
result.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
});

const newCountryAnomaly = result.find((a) => a.type === 'NEW_COUNTRY');
console.log(`\nNew country detected: ${newCountryAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- Login from new country should trigger `NEW_COUNTRY` anomaly
- Severity should be `HIGH`
- Risk score should be 30 (default)

---

### Test 7: Multiple IPs Detection

**Objective:** Verify detection of logins from multiple IPs in a short time window.

**Steps:**

```typescript
import Redis from 'ioredis';
import { LoginPatternAnalyzer, GeoIPService } from '@payments-system/security';

const redis = new Redis();
const geoIP = new GeoIPService();
const analyzer = new LoginPatternAnalyzer(redis, geoIP);

const userId = 'test-user-multiip-001';

// Clear previous test data
await redis.del(`login:pattern:${userId}`);
await redis.del(`login:history:${userId}`);
await redis.del(`login:ips:${userId}`);

console.log('=== Multiple IPs Detection Test ===');

// Login from multiple different IPs within 1 hour
const ips = [
  '192.168.1.1',
  '192.168.2.1',
  '192.168.3.1',
  '192.168.4.1',
];

console.log('Logging in from multiple IPs...');
let result;
for (const ip of ips) {
  result = await analyzer.analyzeLogin({
    userId,
    ip,
    userAgent: 'Mozilla/5.0 Test',
    timestamp: new Date(),
    success: true,
  });
  console.log(`  Logged in from ${ip}`);
}

console.log('\nAnomalies detected on last login:');
result?.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
});

const multipleIPsAnomaly = result?.find((a) => a.type === 'MULTIPLE_IPS');
console.log(`\nMultiple IPs detected: ${multipleIPsAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- After 3+ different IPs in 1 hour, `MULTIPLE_IPS` anomaly should trigger
- Severity should be `MEDIUM`
- Risk score should be 20 (default)

---

### Test 8: Impossible Travel Detection (Login)

**Objective:** Verify impossible travel detection between consecutive logins.

**Prerequisites:** `geoip-lite` must be installed.

**Steps:**

```typescript
import Redis from 'ioredis';
import { LoginPatternAnalyzer, GeoIPService } from '@payments-system/security';

const redis = new Redis();
const geoIP = new GeoIPService();
const analyzer = new LoginPatternAnalyzer(redis, geoIP);

const userId = 'test-user-travel-001';

// Clear previous test data
await redis.del(`login:pattern:${userId}`);
await redis.del(`login:history:${userId}`);

console.log('=== Impossible Travel Detection Test ===');

// Step 1: Login from New York
console.log('Step 1: Login from New York (US)...');
const nyIP = '74.125.224.72'; // Google NYC
await analyzer.analyzeLogin({
  userId,
  ip: nyIP,
  userAgent: 'Mozilla/5.0 Test',
  timestamp: new Date(),
  success: true,
});
console.log(`  Logged in from ${nyIP}`);

// Wait a short time (simulating 30 minutes)
console.log('\nStep 2: Wait 30 minutes (simulated)...');

// Step 3: Login from Tokyo (30 minutes later - impossible!)
console.log('Step 3: Login from Tokyo (Japan) 30 minutes later...');
const tokyoIP = '203.216.227.176'; // Japanese IP

// Create timestamp 30 minutes after first login
const laterTime = new Date(Date.now() + 30 * 60 * 1000);

const result = await analyzer.analyzeLogin({
  userId,
  ip: tokyoIP,
  userAgent: 'Mozilla/5.0 Test',
  timestamp: laterTime,
  success: true,
});

console.log('\nAnomalies detected:');
result.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
  if (anomaly.details) {
    console.log(`    Details: ${JSON.stringify(anomaly.details)}`);
  }
});

const travelAnomaly = result.find((a) => a.type === 'IMPOSSIBLE_TRAVEL');
console.log(`\nImpossible travel detected: ${travelAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- NY to Tokyo in 30 minutes should trigger `IMPOSSIBLE_TRAVEL` anomaly
- Severity should be `CRITICAL`
- Risk score should be 50 (default)
- Details should include distance and time

---

### Test 9: Failed Login Attempts

**Objective:** Verify tracking of failed login attempts before success.

**Steps:**

```typescript
import Redis from 'ioredis';
import { LoginPatternAnalyzer, GeoIPService } from '@payments-system/security';

const redis = new Redis();
const geoIP = new GeoIPService();
const analyzer = new LoginPatternAnalyzer(redis, geoIP);

const userId = 'test-user-failed-001';
const ip = '192.168.1.100';

// Clear previous test data
await redis.del(`login:pattern:${userId}`);
await redis.del(`login:history:${userId}`);
await redis.del(`login:failed:${userId}:${ip}`);

console.log('=== Failed Login Attempts Test ===');

// Simulate 5 failed login attempts
console.log('Simulating 5 failed login attempts...');
for (let i = 1; i <= 5; i++) {
  const result = await analyzer.analyzeLogin({
    userId,
    ip,
    userAgent: 'Mozilla/5.0 Test',
    timestamp: new Date(),
    success: false,
  });
  console.log(`  Failed attempt ${i}`);
}

// Now successful login
console.log('\nNow successful login...');
const result = await analyzer.analyzeLogin({
  userId,
  ip,
  userAgent: 'Mozilla/5.0 Test',
  timestamp: new Date(),
  success: true,
});

console.log('\nAnomalies detected on successful login:');
result.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
  if (anomaly.details?.failedCount) {
    console.log(`    Failed attempts: ${anomaly.details.failedCount}`);
  }
});

const failedAnomaly = result.find((a) => a.type === 'FAILED_ATTEMPTS');
console.log(`\nFailed attempts anomaly detected: ${failedAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- 5+ failed attempts followed by success should trigger `FAILED_ATTEMPTS` anomaly
- Severity depends on count (5+ = MEDIUM, 10+ = HIGH)
- Details should include failed count

---

## Testing Transaction Anomaly Detector

### Test 10: Unusual Transaction Amount

**Objective:** Verify detection of transactions with unusual amounts.

**Steps:**

```typescript
import Redis from 'ioredis';
import { TransactionAnomalyDetector } from '@payments-system/security';

const redis = new Redis();
const detector = new TransactionAnomalyDetector(redis);

const userId = 'test-user-amount-001';

// Clear previous test data
await redis.del(`transaction:pattern:${userId}`);
await redis.del(`transaction:history:${userId}`);
await redis.del(`transaction:timestamps:${userId}`);
await redis.del(`transaction:daily:${userId}`);

console.log('=== Unusual Transaction Amount Test ===');

// Step 1: Establish normal pattern (~$100 transactions)
console.log('Step 1: Establishing normal transaction pattern...');
const normalAmounts = [95, 102, 98, 105, 100, 97, 103, 99, 101, 96];
for (const amount of normalAmounts) {
  await detector.analyzeTransaction({
    userId,
    transactionId: `tx-${Date.now()}-${Math.random()}`,
    amount,
    currency: 'USD',
    type: 'PAYMENT',
    timestamp: new Date(),
  });
  console.log(`  Transaction: $${amount}`);
}

// Step 2: Make unusually large transaction
console.log('\nStep 2: Testing unusually large transaction ($5000)...');
const result = await detector.analyzeTransaction({
  userId,
  transactionId: `tx-unusual-${Date.now()}`,
  amount: 5000,
  currency: 'USD',
  type: 'PAYMENT',
  timestamp: new Date(),
});

console.log('\nAnomalies detected:');
result.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
  if (anomaly.details?.zScore) {
    console.log(`    Z-Score: ${anomaly.details.zScore}`);
  }
});

const amountAnomaly = result.find((a) => a.type === 'UNUSUAL_AMOUNT');
console.log(`\nUnusual amount detected: ${amountAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- $5000 transaction when average is ~$100 should trigger `UNUSUAL_AMOUNT`
- Z-score should be very high (>>2.5 threshold)
- Severity should be `HIGH`

---

### Test 11: High Transaction Frequency

**Objective:** Verify detection of unusually high transaction frequency.

**Steps:**

```typescript
import Redis from 'ioredis';
import { TransactionAnomalyDetector } from '@payments-system/security';

const redis = new Redis();
const detector = new TransactionAnomalyDetector(redis);

const userId = 'test-user-freq-001';

// Clear previous test data
await redis.del(`transaction:pattern:${userId}`);
await redis.del(`transaction:history:${userId}`);
await redis.del(`transaction:timestamps:${userId}`);
await redis.del(`transaction:daily:${userId}`);

console.log('=== High Transaction Frequency Test ===');

// Step 1: Establish normal pattern (2 transactions/day)
console.log('Step 1: Establishing normal frequency pattern...');
// Store pattern directly for testing
await redis.set(`transaction:pattern:${userId}`, JSON.stringify({
  userId,
  averageAmount: 100,
  maxAmount: 150,
  typicalAmounts: [100, 100, 100],
  averageFrequency: 2, // 2 per day
  typicalRecipients: [],
  lastUpdated: new Date(),
}));
console.log('  Set average frequency: 2 transactions/day');

// Step 2: Make many transactions quickly (10 in one session)
console.log('\nStep 2: Making 10 transactions rapidly...');
let result;
for (let i = 1; i <= 10; i++) {
  result = await detector.analyzeTransaction({
    userId,
    transactionId: `tx-rapid-${i}-${Date.now()}`,
    amount: 100,
    currency: 'USD',
    type: 'PAYMENT',
    timestamp: new Date(),
  });
  console.log(`  Transaction ${i} completed`);
}

console.log('\nAnomalies detected on last transaction:');
result?.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
});

const freqAnomaly = result?.find((a) => a.type === 'HIGH_FREQUENCY');
console.log(`\nHigh frequency detected: ${freqAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- 10 transactions when average is 2/day should trigger `HIGH_FREQUENCY`
- Different thresholds for 5-min window (5+), 1-hour window (20+), 24-hour window (3x average)

---

### Test 12: Transaction Velocity Anomaly

**Objective:** Verify detection of rapid transaction velocity.

**Steps:**

```typescript
import Redis from 'ioredis';
import { TransactionAnomalyDetector } from '@payments-system/security';

const redis = new Redis();
const detector = new TransactionAnomalyDetector(redis);

const userId = 'test-user-velocity-001';

// Clear previous test data
await redis.del(`transaction:pattern:${userId}`);
await redis.del(`transaction:history:${userId}`);
await redis.del(`transaction:timestamps:${userId}`);
await redis.del(`transaction:daily:${userId}`);

console.log('=== Transaction Velocity Test ===');

// Make 6+ transactions within 5 minutes (velocity threshold)
console.log('Making 7 transactions within 5 minutes...');
let result;
for (let i = 1; i <= 7; i++) {
  result = await detector.analyzeTransaction({
    userId,
    transactionId: `tx-velocity-${i}-${Date.now()}`,
    amount: 50,
    currency: 'USD',
    type: 'PAYMENT',
    timestamp: new Date(),
  });
  console.log(`  Transaction ${i} at ${new Date().toISOString()}`);

  // Small delay to spread transactions
  await new Promise((r) => setTimeout(r, 100));
}

console.log('\nAnomalies detected:');
result?.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
  if (anomaly.details?.windowMinutes) {
    console.log(`    Window: ${anomaly.details.windowMinutes} minutes`);
    console.log(`    Count: ${anomaly.details.count}`);
  }
});

const velocityAnomaly = result?.find(
  (a) => a.type === 'HIGH_FREQUENCY' && a.details?.windowMinutes === 5
);
console.log(`\nVelocity anomaly (5-min window) detected: ${velocityAnomaly ? 'YES' : 'NO'}`);
```

**Expected Results:**
- 6+ transactions in 5 minutes should trigger velocity anomaly
- Window should be 5 minutes
- Severity should be `HIGH`

---

### Test 13: Daily Total Anomaly

**Objective:** Verify detection of unusually high daily transaction totals.

**Steps:**

```typescript
import Redis from 'ioredis';
import { TransactionAnomalyDetector } from '@payments-system/security';

const redis = new Redis();
const detector = new TransactionAnomalyDetector(redis);

const userId = 'test-user-daily-001';

// Clear previous test data
await redis.del(`transaction:pattern:${userId}`);
await redis.del(`transaction:history:${userId}`);
await redis.del(`transaction:timestamps:${userId}`);
await redis.del(`transaction:daily:${userId}`);

console.log('=== Daily Total Anomaly Test ===');

// Establish pattern: avg $100, 2 transactions/day = $200 daily typical
await redis.set(`transaction:pattern:${userId}`, JSON.stringify({
  userId,
  averageAmount: 100,
  maxAmount: 150,
  typicalAmounts: [100, 100, 100],
  averageFrequency: 2,
  typicalRecipients: [],
  lastUpdated: new Date(),
}));
console.log('Established pattern: $200/day typical');

// Make transactions totaling $1000 (5x typical)
console.log('\nMaking transactions totaling $1000...');
const amounts = [200, 300, 250, 250];
let result;
for (const amount of amounts) {
  result = await detector.analyzeTransaction({
    userId,
    transactionId: `tx-daily-${Date.now()}-${Math.random()}`,
    amount,
    currency: 'USD',
    type: 'PAYMENT',
    timestamp: new Date(),
  });
  console.log(`  Transaction: $${amount}`);
}

console.log('\nAnomalies detected on last transaction:');
result?.forEach((anomaly) => {
  console.log(`  - ${anomaly.type}: ${anomaly.description}`);
  console.log(`    Severity: ${anomaly.severity}, Risk Score: ${anomaly.riskScore}`);
  if (anomaly.details?.dailyTotal) {
    console.log(`    Daily total: $${anomaly.details.dailyTotal}`);
  }
});
```

**Expected Results:**
- Daily total of $1000 when typical is $200 should trigger anomaly
- Threshold is 3x typical daily total

---

## Testing Alert Service

### Test 14: Admin Alert Creation

**Objective:** Verify admin alert creation and storage.

**Steps:**

```typescript
import Redis from 'ioredis';
import { AlertService } from '@payments-system/security';

const redis = new Redis();
const alertService = new AlertService(redis, {
  riskThreshold: 50,
  userNotificationThreshold: 30,
  enableSlack: false,
  enableEmail: false,
});

const userId = 'test-user-alert-001';

// Clear previous alerts
const alertKeys = await redis.keys(`security:*${userId}*`);
if (alertKeys.length) await redis.del(...alertKeys);

console.log('=== Admin Alert Creation Test ===');

const anomalies = [
  {
    type: 'NEW_COUNTRY' as const,
    severity: 'HIGH' as const,
    riskScore: 30,
    description: 'Login from new country: Russia',
    details: { newCountry: 'RU' },
    timestamp: new Date(),
  },
  {
    type: 'UNUSUAL_TIME' as const,
    severity: 'MEDIUM' as const,
    riskScore: 15,
    description: 'Login at unusual time: 3:00 UTC',
    details: { loginHour: 3 },
    timestamp: new Date(),
  },
];

const alert = await alertService.createAlert(
  userId,
  'LOGIN',
  anomalies,
  75, // Total risk score
  { country: 'Russia', countryCode: 'RU', city: 'Moscow', latitude: 55.75, longitude: 37.62, region: null, timezone: 'Europe/Moscow' },
  '91.64.0.1'
);

if (alert) {
  console.log('Alert created:');
  console.log(`  ID: ${alert.id}`);
  console.log(`  User: ${alert.userId}`);
  console.log(`  Event Type: ${alert.eventType}`);
  console.log(`  Risk Score: ${alert.totalRiskScore}`);
  console.log(`  Anomalies: ${alert.anomalies.length}`);
  console.log(`  Location: ${alert.location?.city}, ${alert.location?.country}`);
  console.log(`  IP: ${alert.ip}`);
} else {
  console.log('Alert not created (possibly deduplicated or below threshold)');
}

// Verify storage
const storedAlerts = await alertService.getUserAlerts(userId);
console.log(`\nStored alerts for user: ${storedAlerts.length}`);
```

**Expected Results:**
- Alert should be created with unique ID
- Alert should be stored in Redis
- Alert should contain all anomaly details

---

### Test 15: Alert Deduplication

**Objective:** Verify that duplicate alerts are not created within 1 hour.

**Steps:**

```typescript
import Redis from 'ioredis';
import { AlertService } from '@payments-system/security';

const redis = new Redis();
const alertService = new AlertService(redis, {
  riskThreshold: 50,
  userNotificationThreshold: 30,
});

const userId = 'test-user-dedupe-001';

// Clear previous data
const keys = await redis.keys(`security:*${userId}*`);
if (keys.length) await redis.del(...keys);

console.log('=== Alert Deduplication Test ===');

const anomalies = [
  {
    type: 'NEW_COUNTRY' as const,
    severity: 'HIGH' as const,
    riskScore: 30,
    description: 'Login from new country',
    details: {},
    timestamp: new Date(),
  },
];

// First alert
console.log('Creating first alert...');
const alert1 = await alertService.createAlert(userId, 'LOGIN', anomalies, 75);
console.log(`  First alert: ${alert1 ? alert1.id : 'NOT CREATED'}`);

// Second alert (same anomaly type - should be deduplicated)
console.log('\nCreating second alert (same type)...');
const alert2 = await alertService.createAlert(userId, 'LOGIN', anomalies, 75);
console.log(`  Second alert: ${alert2 ? alert2.id : 'DEDUPLICATED'}`);

// Verify only one alert stored
const storedAlerts = await alertService.getUserAlerts(userId);
console.log(`\nTotal alerts stored: ${storedAlerts.length}`);
console.log(`Deduplication working: ${storedAlerts.length === 1 ? 'YES' : 'NO'}`);
```

**Expected Results:**
- First alert should be created
- Second alert (same type within 1 hour) should return `null`
- Only one alert should be stored

---

### Test 16: User Notification Creation

**Objective:** Verify user notification creation with appropriate messages.

**Steps:**

```typescript
import Redis from 'ioredis';
import { AlertService } from '@payments-system/security';

const redis = new Redis();
const alertService = new AlertService(redis, {
  riskThreshold: 70,
  userNotificationThreshold: 50,
});

const userId = 'test-user-notif-001';

// Clear previous notifications
await redis.del(`security:user_notifications:${userId}`);

console.log('=== User Notification Test ===');

// Test different notification types
const testCases = [
  {
    type: 'NEW_LOGIN' as const,
    anomalies: [{
      type: 'NEW_CITY' as const,
      severity: 'LOW' as const,
      riskScore: 10,
      description: 'Login from new city: Los Angeles',
      details: { city: 'Los Angeles' },
      timestamp: new Date(),
    }],
    riskScore: 55,
  },
  {
    type: 'SECURITY_ALERT' as const,
    anomalies: [{
      type: 'IMPOSSIBLE_TRAVEL' as const,
      severity: 'CRITICAL' as const,
      riskScore: 50,
      description: 'Impossible travel detected',
      details: {},
      timestamp: new Date(),
    }],
    riskScore: 85,
  },
  {
    type: 'UNUSUAL_ACTIVITY' as const,
    anomalies: [{
      type: 'HIGH_FREQUENCY' as const,
      severity: 'MEDIUM' as const,
      riskScore: 25,
      description: 'High transaction frequency',
      details: {},
      timestamp: new Date(),
    }],
    riskScore: 60,
  },
];

for (const testCase of testCases) {
  console.log(`\nCreating ${testCase.type} notification...`);
  const notification = await alertService.createUserNotification(
    userId,
    testCase.type,
    testCase.anomalies,
    testCase.riskScore
  );

  if (notification) {
    console.log(`  Title: ${notification.title}`);
    console.log(`  Message: ${notification.message.substring(0, 80)}...`);
    console.log(`  Severity: ${notification.severity}`);
    console.log(`  Action Required: ${notification.actionRequired}`);
    console.log(`  Action URL: ${notification.actionUrl || 'None'}`);
  }
}

// Get all notifications
const notifications = await alertService.getUserNotifications(userId);
console.log(`\nTotal notifications: ${notifications.length}`);
```

**Expected Results:**
- Each notification type should have appropriate title/message
- `SECURITY_ALERT` should have `actionRequired: true`
- Appropriate `actionUrl` for each type

---

### Test 17: Slack Webhook Integration

**Objective:** Verify Slack webhook notification sending.

**Prerequisites:** Valid Slack webhook URL required.

**Steps:**

```typescript
import Redis from 'ioredis';
import { AlertService } from '@payments-system/security';

const redis = new Redis();

// Replace with your Slack webhook URL
const SLACK_WEBHOOK = process.env.ANOMALY_SLACK_WEBHOOK || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

const alertService = new AlertService(redis, {
  riskThreshold: 50,
  userNotificationThreshold: 30,
  enableSlack: true,
  slackWebhookUrl: SLACK_WEBHOOK,
});

const userId = 'test-user-slack-001';

console.log('=== Slack Webhook Test ===');

// Clear deduplication key to allow alert
await redis.del(`security:alert_dedupe:${userId}:IMPOSSIBLE_TRAVEL`);

const anomalies = [
  {
    type: 'IMPOSSIBLE_TRAVEL' as const,
    severity: 'CRITICAL' as const,
    riskScore: 50,
    description: 'Impossible travel detected: New York to Tokyo in 30 minutes',
    details: {
      previousLocation: 'New York, US',
      currentLocation: 'Tokyo, JP',
      distance: 10850,
      timeMinutes: 30,
    },
    timestamp: new Date(),
  },
];

console.log('Creating alert (will send to Slack)...');
const alert = await alertService.createAlert(
  userId,
  'LOGIN',
  anomalies,
  90,
  { country: 'Japan', countryCode: 'JP', city: 'Tokyo', latitude: 35.68, longitude: 139.65, region: null, timezone: 'Asia/Tokyo' },
  '203.216.227.176'
);

if (alert) {
  console.log('Alert created and Slack notification sent!');
  console.log('Check your Slack channel for the alert message.');
} else {
  console.log('Alert was not created (check threshold or deduplication)');
}
```

**Expected Results:**
- Alert should appear in Slack channel
- Message should include user ID, risk score, anomaly details, location, IP

---

## Testing Anomaly Detection Service

### Test 18: Full Login Analysis

**Objective:** Test the complete login analysis flow with the orchestrator.

**Steps:**

```typescript
import Redis from 'ioredis';
import { createAnomalyDetectionService } from '@payments-system/security';

const redis = new Redis();
const anomalyService = createAnomalyDetectionService(redis);

const userId = 'test-user-full-001';

// Clear all test data
const keys = await redis.keys(`*${userId}*`);
if (keys.length) await redis.del(...keys);

console.log('=== Full Login Analysis Test ===');

// Establish normal pattern
console.log('Step 1: Establishing normal login pattern...');
for (let i = 0; i < 5; i++) {
  await anomalyService.analyzeLogin({
    userId,
    ip: '8.8.8.8', // US IP
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(),
    success: true,
  });
}
console.log('  5 normal logins recorded');

// Simulate suspicious login
console.log('\nStep 2: Analyzing suspicious login...');
const suspiciousTime = new Date();
suspiciousTime.setUTCHours(3, 0, 0, 0); // 3 AM

const result = await anomalyService.analyzeLogin({
  userId,
  ip: '91.64.0.1', // German IP (different country)
  userAgent: 'Mozilla/5.0 (Linux; Android 10)',
  timestamp: suspiciousTime,
  success: true,
});

console.log('\n=== Analysis Results ===');
console.log(`Is Anomalous: ${result.isAnomalous}`);
console.log(`Total Risk Score: ${result.totalRiskScore}`);
console.log(`Should Alert Admins: ${result.shouldAlert}`);
console.log(`Should Notify User: ${result.shouldNotifyUser}`);

console.log('\nAnomalies:');
result.anomalies.forEach((a, i) => {
  console.log(`  ${i + 1}. ${a.type}`);
  console.log(`     Severity: ${a.severity}`);
  console.log(`     Risk Score: ${a.riskScore}`);
  console.log(`     Description: ${a.description}`);
});

console.log('\nRecommendations:');
result.recommendations.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r}`);
});
```

**Expected Results:**
- Analysis should detect multiple anomalies (new country, unusual time, new device)
- Risk score should be calculated with diminishing returns
- Recommendations should be generated based on anomaly types
- `shouldAlert` and `shouldNotifyUser` based on thresholds

---

### Test 19: Full Transaction Analysis

**Objective:** Test the complete transaction analysis flow with the orchestrator.

**Steps:**

```typescript
import Redis from 'ioredis';
import { createAnomalyDetectionService } from '@payments-system/security';

const redis = new Redis();
const anomalyService = createAnomalyDetectionService(redis);

const userId = 'test-user-tx-full-001';

// Clear all test data
const keys = await redis.keys(`*${userId}*`);
if (keys.length) await redis.del(...keys);

console.log('=== Full Transaction Analysis Test ===');

// Establish normal pattern
console.log('Step 1: Establishing normal transaction pattern...');
const normalAmounts = [50, 75, 100, 80, 90, 60, 70, 85, 95, 65];
for (const amount of normalAmounts) {
  await anomalyService.analyzeTransaction({
    userId,
    transactionId: `tx-norm-${Date.now()}-${Math.random()}`,
    amount,
    currency: 'USD',
    type: 'PAYMENT',
    timestamp: new Date(),
  });
}
console.log('  10 normal transactions recorded (avg ~$77)');

// Simulate suspicious transaction
console.log('\nStep 2: Analyzing suspicious transaction ($5000)...');
const result = await anomalyService.analyzeTransaction({
  userId,
  transactionId: `tx-suspicious-${Date.now()}`,
  amount: 5000,
  currency: 'USD',
  type: 'PAYMENT',
  timestamp: new Date(),
});

console.log('\n=== Analysis Results ===');
console.log(`Is Anomalous: ${result.isAnomalous}`);
console.log(`Total Risk Score: ${result.totalRiskScore}`);
console.log(`Should Alert Admins: ${result.shouldAlert}`);
console.log(`Should Notify User: ${result.shouldNotifyUser}`);

console.log('\nAnomalies:');
result.anomalies.forEach((a, i) => {
  console.log(`  ${i + 1}. ${a.type}`);
  console.log(`     Severity: ${a.severity}`);
  console.log(`     Risk Score: ${a.riskScore}`);
  console.log(`     Description: ${a.description}`);
});

console.log('\nRecommendations:');
result.recommendations.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r}`);
});
```

**Expected Results:**
- Should detect unusual amount anomaly
- Recommendations should include manual approval suggestion

---

### Test 20: Alert Acknowledgment

**Objective:** Test the alert acknowledgment flow.

**Steps:**

```typescript
import Redis from 'ioredis';
import { createAnomalyDetectionService } from '@payments-system/security';

const redis = new Redis();
const anomalyService = createAnomalyDetectionService(redis);

const userId = 'test-user-ack-001';

// Clear test data
const keys = await redis.keys(`*${userId}*`);
if (keys.length) await redis.del(...keys);

console.log('=== Alert Acknowledgment Test ===');

// Create an alert by triggering anomaly detection
console.log('Step 1: Creating alert via anomaly detection...');

// Set up pattern that will trigger alert
await redis.set(`login:pattern:${userId}`, JSON.stringify({
  userId,
  typicalHours: [9, 10, 11],
  typicalDays: [1, 2, 3, 4, 5],
  knownCountries: ['US'],
  knownCities: ['new york'],
  knownIPs: ['8.8.8.8'],
  averageLoginFrequency: 2,
  lastUpdated: new Date(),
}));

// Trigger suspicious login at 3 AM from different country
const suspiciousTime = new Date();
suspiciousTime.setUTCHours(3, 0, 0, 0);

await anomalyService.analyzeLogin({
  userId,
  ip: '91.64.0.1',
  userAgent: 'Test',
  timestamp: suspiciousTime,
  success: true,
});

// Get alerts
console.log('\nStep 2: Getting user alerts...');
const alerts = await anomalyService.getUserAlerts(userId);
console.log(`  Found ${alerts.length} alert(s)`);

if (alerts.length > 0) {
  const alertId = alerts[0].id;
  console.log(`  Alert ID: ${alertId}`);
  console.log(`  Acknowledged: ${alerts[0].acknowledged}`);

  // Acknowledge the alert
  console.log('\nStep 3: Acknowledging alert...');
  const acknowledged = await anomalyService.acknowledgeAlert(alertId, 'admin@example.com');
  console.log(`  Acknowledgment result: ${acknowledged ? 'SUCCESS' : 'FAILED'}`);

  // Verify acknowledgment
  const updatedAlerts = await anomalyService.getUserAlerts(userId);
  const updatedAlert = updatedAlerts.find((a) => a.id === alertId);
  console.log(`  Alert now acknowledged: ${updatedAlert?.acknowledged}`);
  console.log(`  Acknowledged by: ${updatedAlert?.acknowledgedBy}`);
}
```

**Expected Results:**
- Alert should be created from suspicious login
- Acknowledgment should succeed
- Alert should show acknowledged status with admin email

---

## Integration Testing

### Test 21: End-to-End Login Flow

**Objective:** Test anomaly detection integrated with the auth service login endpoint.

**Prerequisites:** Auth service must be running.

**Steps:**

1. Start the backend services:
   ```bash
   pnpm dev:backend
   ```

2. Make login requests with different scenarios:

   ```bash
   # Normal login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'

   # Check if anomaly detection was triggered (check logs)
   ```

3. Verify in Redis:
   ```bash
   pnpm redis:keys
   # Look for login:pattern:* and login:history:* keys
   ```

---

### Test 22: End-to-End Payment Flow

**Objective:** Test anomaly detection integrated with the payments service.

**Prerequisites:** Payments service must be running with valid auth token.

**Steps:**

1. Get auth token:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}' \
     | jq -r '.data.accessToken')
   ```

2. Make payment requests:
   ```bash
   # Normal payment
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"amount": 100, "currency": "USD", "description": "Test payment"}'

   # Large payment (should trigger anomaly)
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"amount": 10000, "currency": "USD", "description": "Large payment"}'
   ```

3. Check anomaly detection results in logs or Redis.

---

## Troubleshooting

### Common Issues

#### 1. GeoIP Not Working

**Symptom:** All location lookups return `null`

**Solution:**
```bash
# Install geoip-lite
pnpm add geoip-lite

# Verify installation
node -e "console.log(require('geoip-lite').lookup('8.8.8.8'))"
```

#### 2. Redis Connection Failed

**Symptom:** "Redis not available" warnings

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Restart Redis
pnpm infra:restart
```

#### 3. Alerts Not Being Created

**Symptom:** `createAlert` returns `null`

**Possible Causes:**
1. Risk score below threshold (default 70)
2. Alert deduplicated (same user + anomaly type within 1 hour)
3. Redis not connected

**Debug:**
```typescript
// Check deduplication
const dedupeKey = `security:alert_dedupe:${userId}:${anomalyType}`;
const exists = await redis.exists(dedupeKey);
console.log(`Deduplication key exists: ${exists}`);

// Clear deduplication
await redis.del(dedupeKey);
```

#### 4. Pattern Not Being Learned

**Symptom:** Anomalies not detected for repeat behavior

**Solution:** Patterns require multiple events to establish baseline. Check minimum thresholds:
- Login pattern: 3+ logins to establish hours/days
- Transaction pattern: 5+ transactions for amount average

#### 5. Slack Notifications Not Received

**Symptom:** Alerts created but no Slack message

**Check:**
1. Webhook URL is correct
2. `enableSlack: true` in config
3. Check network connectivity to Slack
4. Look for errors in console logs

---

## Test Data Cleanup

After testing, clean up test data:

```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function cleanupTestData() {
  // Find all test keys
  const patterns = [
    'login:pattern:test-*',
    'login:history:test-*',
    'login:ips:test-*',
    'login:failed:test-*',
    'transaction:pattern:test-*',
    'transaction:history:test-*',
    'transaction:timestamps:test-*',
    'transaction:daily:test-*',
    'security:alerts:*test-*',
    'security:user_alerts:test-*',
    'security:alert_dedupe:test-*',
    'security:user_notifications:test-*',
  ];

  let totalDeleted = 0;
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      totalDeleted += keys.length;
    }
  }

  console.log(`Cleaned up ${totalDeleted} test keys`);
}

cleanupTestData().then(() => redis.quit());
```

---

## Summary

This testing guide covers:

| Test # | Category | Scenario | Key Verification |
|--------|----------|----------|------------------|
| 1 | GeoIP | Private IP Detection | Private IPs identified |
| 2 | GeoIP | Public IP Lookup | Location data returned |
| 3 | GeoIP | Distance Calculation | Haversine accuracy |
| 4 | GeoIP | Impossible Travel | Speed-based detection |
| 5 | Login | Unusual Time | Hour pattern matching |
| 6 | Login | New Country | Country change detection |
| 7 | Login | Multiple IPs | IP count threshold |
| 8 | Login | Impossible Travel | Distance/time analysis |
| 9 | Login | Failed Attempts | Brute force detection |
| 10 | Transaction | Unusual Amount | Z-score calculation |
| 11 | Transaction | High Frequency | Daily threshold |
| 12 | Transaction | Velocity | 5-min window |
| 13 | Transaction | Daily Total | Accumulated amount |
| 14 | Alert | Admin Alert | Alert creation/storage |
| 15 | Alert | Deduplication | 1-hour window |
| 16 | Alert | User Notification | Message generation |
| 17 | Alert | Slack Webhook | External notification |
| 18 | Service | Full Login | Orchestration |
| 19 | Service | Full Transaction | Orchestration |
| 20 | Service | Acknowledgment | Alert workflow |
| 21 | Integration | Login E2E | Auth service |
| 22 | Integration | Payment E2E | Payments service |

Run all tests systematically to verify the anomaly detection system is working correctly before deploying to production.
