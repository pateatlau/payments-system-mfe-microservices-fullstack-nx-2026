/**
 * React Hooks for Analytics
 *
 * Provides React hooks for easy analytics tracking in components.
 */

import { useEffect, useCallback } from 'react';
import { analytics } from '../lib/analytics';

/**
 * Hook to access analytics tracking functions
 *
 * @returns Object with analytics tracking methods
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      analytics.trackEvent(name, properties);
    },
    []
  );

  const trackMfeLoad = useCallback((mfeName: string, loadTime: number) => {
    analytics.trackMfeLoad(mfeName, loadTime);
  }, []);

  const trackApiCall = useCallback(
    (endpoint: string, duration: number, success: boolean) => {
      analytics.trackApiCall(endpoint, duration, success);
    },
    []
  );

  const trackCacheHit = useCallback(
    (cacheType: 'query' | 'service-worker' | 'redis', key?: string) => {
      analytics.trackCacheHit(cacheType, key);
    },
    []
  );

  const trackCacheMiss = useCallback(
    (cacheType: 'query' | 'service-worker' | 'redis', key?: string) => {
      analytics.trackCacheMiss(cacheType, key);
    },
    []
  );

  return {
    trackEvent,
    trackMfeLoad,
    trackApiCall,
    trackCacheHit,
    trackCacheMiss,
    getMetrics: () => analytics.getMetrics(),
    getCacheHitRate: (cacheType?: 'query' | 'service-worker' | 'redis') =>
      analytics.getCacheHitRate(cacheType),
    getAverageApiDuration: (endpoint: string) =>
      analytics.getAverageApiDuration(endpoint),
  };
}

/**
 * Hook to automatically track MFE load time
 *
 * @param mfeName - Name of the MFE (e.g., 'auth-mfe', 'payments-mfe')
 */
export function useMfeLoadTracking(mfeName: string): void {
  useEffect(() => {
    const startTime = performance.now();

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      analytics.trackMfeLoad(mfeName, loadTime);
    };

    // Track load when component mounts
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, [mfeName]);
}
