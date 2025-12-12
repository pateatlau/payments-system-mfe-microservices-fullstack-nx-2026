/**
 * Analytics Hooks Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics, useMfeLoadTracking } from './useAnalytics';
import { analytics } from '../lib/analytics';

// Mock analytics
jest.mock('../lib/analytics', () => {
  const mockAnalytics = {
    trackEvent: jest.fn(),
    trackMfeLoad: jest.fn(),
    trackApiCall: jest.fn(),
    trackCacheHit: jest.fn(),
    trackCacheMiss: jest.fn(),
    getMetrics: jest.fn(() => ({
      events: [],
      mfeLoadTimes: {},
      apiCallMetrics: {},
      cacheMetrics: { hits: 0, misses: 0, byType: {} },
    })),
    getCacheHitRate: jest.fn(() => 0),
    getAverageApiDuration: jest.fn(() => 0),
  };
  return {
    analytics: mockAnalytics,
  };
});

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide trackEvent function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.trackEvent('test:event', { key: 'value' });

    expect(analytics.trackEvent).toHaveBeenCalledWith('test:event', {
      key: 'value',
    });
  });

  it('should provide trackMfeLoad function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.trackMfeLoad('auth-mfe', 123.45);

    expect(analytics.trackMfeLoad).toHaveBeenCalledWith('auth-mfe', 123.45);
  });

  it('should provide trackApiCall function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.trackApiCall('/api/test', 150, true);

    expect(analytics.trackApiCall).toHaveBeenCalledWith('/api/test', 150, true);
  });

  it('should provide trackCacheHit function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.trackCacheHit('query', 'key');

    expect(analytics.trackCacheHit).toHaveBeenCalledWith('query', 'key');
  });

  it('should provide trackCacheMiss function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.trackCacheMiss('query', 'key');

    expect(analytics.trackCacheMiss).toHaveBeenCalledWith('query', 'key');
  });

  it('should provide getMetrics function', () => {
    const { result } = renderHook(() => useAnalytics());

    const metrics = result.current.getMetrics();

    expect(analytics.getMetrics).toHaveBeenCalled();
    expect(metrics).toBeDefined();
  });

  it('should provide getCacheHitRate function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.getCacheHitRate('query');

    expect(analytics.getCacheHitRate).toHaveBeenCalledWith('query');
  });

  it('should provide getAverageApiDuration function', () => {
    const { result } = renderHook(() => useAnalytics());

    result.current.getAverageApiDuration('/api/test');

    expect(analytics.getAverageApiDuration).toHaveBeenCalledWith('/api/test');
  });
});

describe('useMfeLoadTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track MFE load time when document is already loaded', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    renderHook(() => useMfeLoadTracking('auth-mfe'));

    expect(analytics.trackMfeLoad).toHaveBeenCalled();
  });

  it('should track MFE load time on window load event', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      writable: true,
    });

    renderHook(() => useMfeLoadTracking('auth-mfe'));

    // Simulate window load
    window.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(analytics.trackMfeLoad).toHaveBeenCalled();
    });
  });

  it('should clean up event listener on unmount', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      writable: true,
    });

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useMfeLoadTracking('auth-mfe'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );
  });
});
