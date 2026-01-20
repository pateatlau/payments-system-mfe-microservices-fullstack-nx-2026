/**
 * Transaction Anomaly Detector
 *
 * Analyzes transaction patterns to detect anomalies:
 * - Unusual transaction amounts
 * - High transaction frequency
 * - Unusual recipients
 * - Velocity anomalies (rapid successive transactions)
 *
 * Uses Redis for storing user transaction history and patterns
 */

import type Redis from 'ioredis';
import type {
  TransactionEvent,
  TransactionPattern,
  Anomaly,
  AnomalyDetectionConfig,
} from './types';
import { DEFAULT_ANOMALY_CONFIG } from './types';

/**
 * Redis key prefixes for transaction pattern storage
 */
const REDIS_KEYS = {
  TRANSACTION_HISTORY: 'security:tx_history:', // {userId}
  TRANSACTION_PATTERN: 'security:tx_pattern:', // {userId}
  RECENT_TRANSACTIONS: 'security:recent_tx:', // {userId}
  DAILY_TOTAL: 'security:daily_total:', // {userId}:{date}
};

/**
 * Transaction event stored in Redis
 */
interface StoredTransactionEvent {
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  timestamp: string;
  recipientId?: string;
}

/**
 * Transaction Anomaly Detector Service
 */
export class TransactionAnomalyDetector {
  private redis: Redis | null;
  private config: AnomalyDetectionConfig;

  constructor(
    redis: Redis | null,
    config?: Partial<AnomalyDetectionConfig>
  ) {
    this.redis = redis;
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };

    if (!this.redis) {
      console.warn(
        '[TransactionAnomalyDetector] Redis not available, transaction analysis disabled'
      );
    }
  }

  /**
   * Analyze a transaction for anomalies
   *
   * @param event - Transaction event to analyze
   * @returns Array of detected anomalies
   */
  async analyzeTransaction(event: TransactionEvent): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (!this.redis || !this.config.transactionAnalysisEnabled) {
      return anomalies;
    }

    try {
      // Get user's historical pattern
      const pattern = await this.getTransactionPattern(event.userId);

      // Check for unusual amount
      const amountAnomaly = this.checkUnusualAmount(event, pattern);
      if (amountAnomaly) {
        anomalies.push(amountAnomaly);
      }

      // Check for high frequency
      const frequencyAnomaly = await this.checkHighFrequency(event, pattern);
      if (frequencyAnomaly) {
        anomalies.push(frequencyAnomaly);
      }

      // Check for velocity anomaly (rapid transactions)
      const velocityAnomaly = await this.checkVelocity(event);
      if (velocityAnomaly) {
        anomalies.push(velocityAnomaly);
      }

      // Check daily transaction total
      const dailyTotalAnomaly = await this.checkDailyTotal(event, pattern);
      if (dailyTotalAnomaly) {
        anomalies.push(dailyTotalAnomaly);
      }

      // Record this transaction for future pattern analysis
      await this.recordTransactionEvent(event);
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error analyzing transaction:',
        error
      );
    }

    return anomalies;
  }

  /**
   * Check if transaction amount is unusual
   */
  private checkUnusualAmount(
    event: TransactionEvent,
    pattern: TransactionPattern | null
  ): Anomaly | null {
    if (!pattern || pattern.averageAmount === 0) {
      return null;
    }

    // Calculate how many standard deviations from mean
    const deviation = Math.abs(event.amount - pattern.averageAmount);
    const stdDev = this.calculateStdDev(pattern);

    // Check z-score if we have enough variance
    if (stdDev > 0) {
      const zScore = deviation / stdDev;

      if (zScore >= this.config.amountDeviationThreshold) {
        const isHigher = event.amount > pattern.averageAmount;
        const percentDiff = ((event.amount - pattern.averageAmount) / pattern.averageAmount) * 100;

        return {
          type: 'UNUSUAL_AMOUNT',
          severity: zScore >= 4 ? 'HIGH' : 'MEDIUM',
          riskScore: this.config.riskScores.UNUSUAL_AMOUNT,
          description: `Transaction amount ${isHigher ? 'higher' : 'lower'} than typical: ${event.amount} ${event.currency} (${Math.abs(percentDiff).toFixed(0)}% ${isHigher ? 'above' : 'below'} average)`,
          details: {
            transactionAmount: event.amount,
            currency: event.currency,
            averageAmount: pattern.averageAmount,
            maxAmount: pattern.maxAmount,
            zScore: zScore.toFixed(2),
            percentDifference: percentDiff.toFixed(1),
          },
          timestamp: event.timestamp,
        };
      }
    }

    // Also check if amount exceeds historical maximum by significant margin
    // This check works even when stdDev is 0
    if (event.amount > pattern.maxAmount * 1.5 && event.amount > pattern.averageAmount * 2) {
      return {
        type: 'UNUSUAL_AMOUNT',
        severity: 'HIGH',
        riskScore: this.config.riskScores.UNUSUAL_AMOUNT,
        description: `Transaction amount significantly exceeds historical maximum: ${event.amount} ${event.currency} (max was ${pattern.maxAmount})`,
        details: {
          transactionAmount: event.amount,
          currency: event.currency,
          historicalMax: pattern.maxAmount,
          averageAmount: pattern.averageAmount,
        },
        timestamp: event.timestamp,
      };
    }

    return null;
  }

  /**
   * Check for high transaction frequency
   */
  private async checkHighFrequency(
    event: TransactionEvent,
    pattern: TransactionPattern | null
  ): Promise<Anomaly | null> {
    if (!this.redis || !pattern || pattern.averageFrequency === 0) {
      return null;
    }

    try {
      // Get transactions in last 24 hours
      const key = REDIS_KEYS.RECENT_TRANSACTIONS + event.userId;
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentCount = await this.redis.zcount(key, dayAgo, '+inf');

      const frequencyRatio = recentCount / pattern.averageFrequency;

      if (frequencyRatio >= this.config.frequencyDeviationThreshold) {
        return {
          type: 'HIGH_FREQUENCY',
          severity: frequencyRatio >= 5 ? 'HIGH' : 'MEDIUM',
          riskScore: this.config.riskScores.HIGH_FREQUENCY,
          description: `High transaction frequency: ${recentCount} transactions in 24 hours (typical: ${pattern.averageFrequency.toFixed(1)}/day)`,
          details: {
            transactionsToday: recentCount,
            averagePerDay: pattern.averageFrequency,
            frequencyMultiplier: frequencyRatio.toFixed(1),
          },
          timestamp: event.timestamp,
        };
      }
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error checking frequency:',
        error
      );
    }

    return null;
  }

  /**
   * Check for velocity anomalies (rapid successive transactions)
   */
  private async checkVelocity(event: TransactionEvent): Promise<Anomaly | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const key = REDIS_KEYS.RECENT_TRANSACTIONS + event.userId;

      // Check transactions in last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const rapidCount = await this.redis.zcount(key, fiveMinutesAgo, '+inf');

      // More than 5 transactions in 5 minutes is suspicious
      if (rapidCount >= 5) {
        return {
          type: 'HIGH_FREQUENCY',
          severity: 'HIGH',
          riskScore: this.config.riskScores.HIGH_FREQUENCY + 10, // Bonus for rapid velocity
          description: `Rapid transaction velocity: ${rapidCount} transactions in 5 minutes`,
          details: {
            transactionCount: rapidCount,
            windowMinutes: 5,
            currentTransactionId: event.transactionId,
          },
          timestamp: event.timestamp,
        };
      }

      // Check transactions in last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const hourlyCount = await this.redis.zcount(key, oneHourAgo, '+inf');

      // More than 20 transactions in an hour is suspicious
      if (hourlyCount >= 20) {
        return {
          type: 'HIGH_FREQUENCY',
          severity: 'MEDIUM',
          riskScore: this.config.riskScores.HIGH_FREQUENCY,
          description: `High hourly transaction rate: ${hourlyCount} transactions in 1 hour`,
          details: {
            transactionCount: hourlyCount,
            windowMinutes: 60,
          },
          timestamp: event.timestamp,
        };
      }
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error checking velocity:',
        error
      );
    }

    return null;
  }

  /**
   * Check if daily transaction total is unusually high
   */
  private async checkDailyTotal(
    event: TransactionEvent,
    pattern: TransactionPattern | null
  ): Promise<Anomaly | null> {
    if (!this.redis || !pattern) {
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const key = REDIS_KEYS.DAILY_TOTAL + event.userId + ':' + today;

      // Increment daily total (incrbyfloat returns string)
      const newTotalStr = await this.redis.incrbyfloat(key, event.amount);
      const newTotal = parseFloat(String(newTotalStr));
      await this.redis.expire(key, 48 * 3600); // Expire after 48 hours

      // Calculate typical daily total
      const typicalDailyTotal = pattern.averageAmount * pattern.averageFrequency;

      if (typicalDailyTotal > 0 && newTotal > typicalDailyTotal * 3) {
        return {
          type: 'UNUSUAL_AMOUNT',
          severity: 'HIGH',
          riskScore: this.config.riskScores.UNUSUAL_AMOUNT,
          description: `Daily transaction total unusually high: ${newTotal.toFixed(2)} ${event.currency} (typical: ${typicalDailyTotal.toFixed(2)})`,
          details: {
            dailyTotal: newTotal,
            typicalDaily: typicalDailyTotal,
            multiplier: (newTotal / typicalDailyTotal).toFixed(1),
          },
          timestamp: event.timestamp,
        };
      }
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error checking daily total:',
        error
      );
    }

    return null;
  }

  /**
   * Get user's transaction pattern from Redis
   */
  async getTransactionPattern(userId: string): Promise<TransactionPattern | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const key = REDIS_KEYS.TRANSACTION_PATTERN + userId;
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as TransactionPattern;
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error getting pattern:',
        error
      );
      return null;
    }
  }

  /**
   * Record a transaction event and update patterns
   */
  private async recordTransactionEvent(event: TransactionEvent): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const historyKey = REDIS_KEYS.TRANSACTION_HISTORY + event.userId;
      const recentKey = REDIS_KEYS.RECENT_TRANSACTIONS + event.userId;

      // Store the transaction event
      const storedEvent: StoredTransactionEvent = {
        transactionId: event.transactionId,
        amount: event.amount,
        currency: event.currency,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        recipientId: event.recipientId,
      };

      // Add to history list
      await this.redis.lpush(historyKey, JSON.stringify(storedEvent));
      await this.redis.ltrim(historyKey, 0, 499); // Keep last 500 transactions
      await this.redis.expire(
        historyKey,
        this.config.transactionHistoryDays * 24 * 3600
      );

      // Add to recent transactions sorted set (score = timestamp)
      await this.redis.zadd(recentKey, Date.now(), event.transactionId);
      // Clean up old entries (older than 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(recentKey, 0, weekAgo);
      await this.redis.expire(recentKey, 7 * 24 * 3600);

      // Update user's pattern
      await this.updateTransactionPattern(event);
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error recording transaction:',
        error
      );
    }
  }

  /**
   * Update user's transaction pattern based on new event
   */
  private async updateTransactionPattern(event: TransactionEvent): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const key = REDIS_KEYS.TRANSACTION_PATTERN + event.userId;
      let pattern = await this.getTransactionPattern(event.userId);

      if (!pattern) {
        pattern = {
          userId: event.userId,
          averageAmount: event.amount,
          maxAmount: event.amount,
          typicalAmounts: [event.amount],
          averageFrequency: 1,
          typicalRecipients: event.recipientId ? [event.recipientId] : [],
          lastUpdated: new Date(),
        };
      } else {
        // Update running average
        const weight = 0.1; // New transactions have 10% weight
        pattern.averageAmount =
          pattern.averageAmount * (1 - weight) + event.amount * weight;

        // Update max
        if (event.amount > pattern.maxAmount) {
          pattern.maxAmount = event.amount;
        }

        // Update typical amounts histogram (keep last 100)
        pattern.typicalAmounts.push(event.amount);
        if (pattern.typicalAmounts.length > 100) {
          pattern.typicalAmounts.shift();
        }

        // Update typical recipients
        if (
          event.recipientId &&
          !pattern.typicalRecipients.includes(event.recipientId)
        ) {
          pattern.typicalRecipients.push(event.recipientId);
          if (pattern.typicalRecipients.length > 50) {
            pattern.typicalRecipients.shift();
          }
        }

        pattern.lastUpdated = new Date();
      }

      // Calculate average frequency from recent transactions
      const recentKey = REDIS_KEYS.RECENT_TRANSACTIONS + event.userId;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyCount = await this.redis.zcount(recentKey, weekAgo, '+inf');
      pattern.averageFrequency = weeklyCount / 7; // Average per day

      await this.redis.set(
        key,
        JSON.stringify(pattern),
        'EX',
        this.config.transactionHistoryDays * 24 * 3600
      );
    } catch (error) {
      console.error(
        '[TransactionAnomalyDetector] Error updating pattern:',
        error
      );
    }
  }

  /**
   * Calculate standard deviation for amount distribution
   */
  private calculateStdDev(pattern: TransactionPattern): number {
    if (pattern.typicalAmounts.length < 2) {
      return 0;
    }

    const mean = pattern.averageAmount;
    const squaredDiffs = pattern.typicalAmounts.map((amount) =>
      Math.pow(amount - mean, 2)
    );
    const avgSquaredDiff =
      squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

    return Math.sqrt(avgSquaredDiff);
  }
}
