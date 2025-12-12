/**
 * Analytics Library Tests
 */

import { Analytics, analytics } from './analytics';

describe('Analytics', () => {
  let testAnalytics: Analytics;

  beforeEach(() => {
    testAnalytics = new Analytics();
  });

  describe('trackEvent', () => {
    it('should track an event with name and properties', () => {
      testAnalytics.trackEvent('test:event', { key: 'value' });

      const metrics = testAnalytics.getMetrics();
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('test:event');
      expect(metrics.events[0].properties).toEqual({ key: 'value' });
      expect(metrics.events[0].timestamp).toBeInstanceOf(Date);
    });

    it('should track an event without properties', () => {
      testAnalytics.trackEvent('test:event');

      const metrics = testAnalytics.getMetrics();
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('test:event');
      expect(metrics.events[0].properties).toBeUndefined();
    });
  });

  describe('trackMfeLoad', () => {
    it('should track MFE load time', () => {
      testAnalytics.trackMfeLoad('auth-mfe', 123.45);

      const metrics = testAnalytics.getMetrics();
      expect(metrics.mfeLoadTimes['auth-mfe']).toBe(123.45);
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('mfe:loaded');
      expect(metrics.events[0].properties).toEqual({
        mfeName: 'auth-mfe',
        loadTime: 123.45,
      });
    });

    it('should update MFE load time if tracked multiple times', () => {
      testAnalytics.trackMfeLoad('auth-mfe', 100);
      testAnalytics.trackMfeLoad('auth-mfe', 200);

      const metrics = testAnalytics.getMetrics();
      expect(metrics.mfeLoadTimes['auth-mfe']).toBe(200);
    });
  });

  describe('trackApiCall', () => {
    it('should track successful API call', () => {
      testAnalytics.trackApiCall('/api/auth/login', 150, true);

      const metrics = testAnalytics.getMetrics();
      const apiMetrics = metrics.apiCallMetrics['/api/auth/login'];
      expect(apiMetrics).toBeDefined();
      expect(apiMetrics.count).toBe(1);
      expect(apiMetrics.totalTime).toBe(150);
      expect(apiMetrics.errors).toBe(0);
    });

    it('should track failed API call', () => {
      testAnalytics.trackApiCall('/api/auth/login', 150, false);

      const metrics = testAnalytics.getMetrics();
      const apiMetrics = metrics.apiCallMetrics['/api/auth/login'];
      expect(apiMetrics).toBeDefined();
      expect(apiMetrics.count).toBe(1);
      expect(apiMetrics.totalTime).toBe(150);
      expect(apiMetrics.errors).toBe(1);
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('api:error');
    });

    it('should accumulate API call metrics', () => {
      testAnalytics.trackApiCall('/api/auth/login', 100, true);
      testAnalytics.trackApiCall('/api/auth/login', 200, true);
      testAnalytics.trackApiCall('/api/auth/login', 150, false);

      const metrics = testAnalytics.getMetrics();
      const apiMetrics = metrics.apiCallMetrics['/api/auth/login'];
      expect(apiMetrics.count).toBe(3);
      expect(apiMetrics.totalTime).toBe(450);
      expect(apiMetrics.errors).toBe(1);
    });
  });

  describe('trackCacheHit', () => {
    it('should track cache hit', () => {
      testAnalytics.trackCacheHit('query', 'user:123');

      const metrics = testAnalytics.getMetrics();
      expect(metrics.cacheMetrics.hits).toBe(1);
      expect(metrics.cacheMetrics.misses).toBe(0);
      expect(metrics.cacheMetrics.byType['query'].hits).toBe(1);
      expect(metrics.cacheMetrics.byType['query'].misses).toBe(0);
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('cache:hit');
    });

    it('should track cache hit without key', () => {
      testAnalytics.trackCacheHit('service-worker');

      const metrics = testAnalytics.getMetrics();
      expect(metrics.cacheMetrics.hits).toBe(1);
      expect(metrics.cacheMetrics.byType['service-worker'].hits).toBe(1);
    });
  });

  describe('trackCacheMiss', () => {
    it('should track cache miss', () => {
      testAnalytics.trackCacheMiss('query', 'user:123');

      const metrics = testAnalytics.getMetrics();
      expect(metrics.cacheMetrics.hits).toBe(0);
      expect(metrics.cacheMetrics.misses).toBe(1);
      expect(metrics.cacheMetrics.byType['query'].hits).toBe(0);
      expect(metrics.cacheMetrics.byType['query'].misses).toBe(1);
      expect(metrics.events).toHaveLength(1);
      expect(metrics.events[0].name).toBe('cache:miss');
    });
  });

  describe('getCacheHitRate', () => {
    it('should return 0 when no cache operations', () => {
      expect(testAnalytics.getCacheHitRate()).toBe(0);
    });

    it('should calculate overall cache hit rate', () => {
      testAnalytics.trackCacheHit('query');
      testAnalytics.trackCacheHit('query');
      testAnalytics.trackCacheMiss('query');

      expect(testAnalytics.getCacheHitRate()).toBeCloseTo(66.67, 1);
    });

    it('should calculate cache hit rate for specific type', () => {
      testAnalytics.trackCacheHit('query');
      testAnalytics.trackCacheMiss('query');
      testAnalytics.trackCacheHit('service-worker');
      testAnalytics.trackCacheHit('service-worker');

      expect(testAnalytics.getCacheHitRate('query')).toBe(50);
      expect(testAnalytics.getCacheHitRate('service-worker')).toBe(100);
    });
  });

  describe('getAverageApiDuration', () => {
    it('should return 0 when no API calls', () => {
      expect(testAnalytics.getAverageApiDuration('/api/test')).toBe(0);
    });

    it('should calculate average API duration', () => {
      testAnalytics.trackApiCall('/api/test', 100, true);
      testAnalytics.trackApiCall('/api/test', 200, true);
      testAnalytics.trackApiCall('/api/test', 300, true);

      expect(testAnalytics.getAverageApiDuration('/api/test')).toBe(200);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      testAnalytics.trackEvent('test:event');
      testAnalytics.trackMfeLoad('auth-mfe', 100);
      testAnalytics.trackApiCall('/api/test', 100, true);
      testAnalytics.trackCacheHit('query');

      testAnalytics.clear();

      const metrics = testAnalytics.getMetrics();
      expect(metrics.events).toHaveLength(0);
      expect(Object.keys(metrics.mfeLoadTimes)).toHaveLength(0);
      expect(Object.keys(metrics.apiCallMetrics)).toHaveLength(0);
      expect(metrics.cacheMetrics.hits).toBe(0);
      expect(metrics.cacheMetrics.misses).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should return a copy of metrics', () => {
      testAnalytics.trackEvent('test:event');
      const metrics1 = testAnalytics.getMetrics();
      const metrics2 = testAnalytics.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1.events).not.toBe(metrics2.events);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton analytics instance', () => {
      expect(analytics).toBeInstanceOf(Analytics);
    });
  });
});
