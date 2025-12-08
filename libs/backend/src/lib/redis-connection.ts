/**
 * Redis Connection Manager
 *
 * Manages Redis connections for Event Hub
 */

import Redis from 'ioredis';

/**
 * Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number | void;
}

/**
 * Default Redis configuration
 */
const defaultConfig: RedisConfig = {
  host: process.env['REDIS_HOST'] ?? 'localhost',
  port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
  password: process.env['REDIS_PASSWORD'],
  db: parseInt(process.env['REDIS_DB'] ?? '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * Create a new Redis connection
 *
 * @param config - Redis configuration
 * @returns Redis client instance
 */
export const createRedisConnection = (config?: Partial<RedisConfig>): Redis => {
  const finalConfig = { ...defaultConfig, ...config };

  return new Redis({
    host: finalConfig.host,
    port: finalConfig.port,
    password: finalConfig.password,
    db: finalConfig.db,
    retryStrategy: finalConfig.retryStrategy,
  });
};

/**
 * Singleton Redis publisher client
 */
let publisherClient: Redis | null = null;

/**
 * Get or create Redis publisher client
 *
 * @returns Redis publisher client
 */
export const getPublisherClient = (): Redis => {
  if (!publisherClient) {
    publisherClient = createRedisConnection();
  }
  return publisherClient;
};

/**
 * Singleton Redis subscriber client
 */
let subscriberClient: Redis | null = null;

/**
 * Get or create Redis subscriber client
 *
 * @returns Redis subscriber client
 */
export const getSubscriberClient = (): Redis => {
  if (!subscriberClient) {
    subscriberClient = createRedisConnection();
  }
  return subscriberClient;
};

/**
 * Close all Redis connections
 */
export const closeRedisConnections = async (): Promise<void> => {
  if (publisherClient) {
    await publisherClient.quit();
    publisherClient = null;
  }

  if (subscriberClient) {
    await subscriberClient.quit();
    subscriberClient = null;
  }
};
