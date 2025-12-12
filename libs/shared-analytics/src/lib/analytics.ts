/**
 * Analytics Library
 *
 * Provides frontend analytics tracking for:
 * - Event tracking
 * - MFE load times
 * - API call patterns
 * - Cache hit/miss rates
 *
 * Architecture-focused analytics for understanding system performance and usage patterns.
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApiCallMetrics {
  count: number;
  totalTime: number;
  errors: number;
}

export interface AnalyticsMetrics {
  events: AnalyticsEvent[];
  mfeLoadTimes: Record<string, number>;
  apiCallMetrics: Record<string, ApiCallMetrics>;
  cacheMetrics: {
    hits: number;
    misses: number;
    byType: Record<string, { hits: number; misses: number }>;
  };
}

/**
 * Analytics class for tracking frontend metrics
 */
export class Analytics {
  private events: AnalyticsEvent[] = [];
  private mfeLoadTimes: Map<string, number> = new Map();
  private apiCallMetrics: Map<string, ApiCallMetrics> = new Map();
  private cacheMetrics = {
    hits: 0,
    misses: 0,
    byType: new Map<string, { hits: number; misses: number }>(),
  };

  /**
   * Track a custom event
   *
   * @param name - Event name (e.g., 'user:clicked_button')
   * @param properties - Optional event properties
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    this.events.push({
      name,
      properties,
      timestamp: new Date(),
    });

    // In development, log events for debugging
    if (process.env['NODE_ENV'] === 'development') {
      console.log('[Analytics] Event:', name, properties);
    }
  }

  /**
   * Track MFE load time
   *
   * @param mfeName - Name of the MFE (e.g., 'auth-mfe', 'payments-mfe')
   * @param loadTime - Load time in milliseconds
   */
  trackMfeLoad(mfeName: string, loadTime: number): void {
    this.mfeLoadTimes.set(mfeName, loadTime);
    this.trackEvent('mfe:loaded', { mfeName, loadTime });
  }

  /**
   * Track API call metrics
   *
   * @param endpoint - API endpoint (e.g., '/api/auth/login')
   * @param duration - Request duration in milliseconds
   * @param success - Whether the request was successful
   */
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    const key = endpoint;
    const current = this.apiCallMetrics.get(key) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    };

    this.apiCallMetrics.set(key, {
      count: current.count + 1,
      totalTime: current.totalTime + duration,
      errors: success ? current.errors : current.errors + 1,
    });

    if (!success) {
      this.trackEvent('api:error', { endpoint, duration });
    } else {
      this.trackEvent('api:call', { endpoint, duration, success: true });
    }
  }

  /**
   * Track cache hit
   *
   * @param cacheType - Type of cache ('query', 'service-worker', 'redis')
   * @param key - Cache key (optional, for debugging)
   */
  trackCacheHit(
    cacheType: 'query' | 'service-worker' | 'redis',
    key?: string
  ): void {
    this.cacheMetrics.hits++;
    const typeMetrics = this.cacheMetrics.byType.get(cacheType) || {
      hits: 0,
      misses: 0,
    };
    this.cacheMetrics.byType.set(cacheType, {
      ...typeMetrics,
      hits: typeMetrics.hits + 1,
    });

    this.trackEvent('cache:hit', { cacheType, key });
  }

  /**
   * Track cache miss
   *
   * @param cacheType - Type of cache ('query', 'service-worker', 'redis')
   * @param key - Cache key (optional, for debugging)
   */
  trackCacheMiss(
    cacheType: 'query' | 'service-worker' | 'redis',
    key?: string
  ): void {
    this.cacheMetrics.misses++;
    const typeMetrics = this.cacheMetrics.byType.get(cacheType) || {
      hits: 0,
      misses: 0,
    };
    this.cacheMetrics.byType.set(cacheType, {
      ...typeMetrics,
      misses: typeMetrics.misses + 1,
    });

    this.trackEvent('cache:miss', { cacheType, key });
  }

  /**
   * Get all collected metrics
   *
   * @returns Analytics metrics object
   */
  getMetrics(): AnalyticsMetrics {
    return {
      events: [...this.events],
      mfeLoadTimes: Object.fromEntries(this.mfeLoadTimes),
      apiCallMetrics: Object.fromEntries(
        Array.from(this.apiCallMetrics.entries()).map(([key, value]) => [
          key,
          { ...value },
        ])
      ),
      cacheMetrics: {
        hits: this.cacheMetrics.hits,
        misses: this.cacheMetrics.misses,
        byType: Object.fromEntries(
          Array.from(this.cacheMetrics.byType.entries()).map(([key, value]) => [
            key,
            { ...value },
          ])
        ),
      },
    };
  }

  /**
   * Clear all metrics (useful for testing or reset)
   */
  clear(): void {
    this.events = [];
    this.mfeLoadTimes.clear();
    this.apiCallMetrics.clear();
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      byType: new Map(),
    };
  }

  /**
   * Get cache hit rate
   *
   * @param cacheType - Optional cache type filter
   * @returns Hit rate as a percentage (0-100)
   */
  getCacheHitRate(cacheType?: 'query' | 'service-worker' | 'redis'): number {
    if (cacheType) {
      const typeMetrics = this.cacheMetrics.byType.get(cacheType);
      if (!typeMetrics) return 0;
      const total = typeMetrics.hits + typeMetrics.misses;
      return total === 0 ? 0 : (typeMetrics.hits / total) * 100;
    }

    const total = this.cacheMetrics.hits + this.cacheMetrics.misses;
    return total === 0 ? 0 : (this.cacheMetrics.hits / total) * 100;
  }

  /**
   * Get average API call duration for an endpoint
   *
   * @param endpoint - API endpoint
   * @returns Average duration in milliseconds, or 0 if no calls
   */
  getAverageApiDuration(endpoint: string): number {
    const metrics = this.apiCallMetrics.get(endpoint);
    if (!metrics || metrics.count === 0) return 0;
    return metrics.totalTime / metrics.count;
  }
}

/**
 * Singleton analytics instance
 */
export const analytics = new Analytics();
