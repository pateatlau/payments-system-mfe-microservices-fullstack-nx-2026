/**
 * Tests for Remote Health Check Utilities
 */

import {
  checkRemoteHealth,
  checkAllRemotesHealth,
  getAggregatedHealthStatus,
  getDefaultMfeConfigs,
  isRemoteHealthy,
  RemoteHealthResponse,
  MfeConfig,
} from './remote-health-check';
import { remoteCircuitBreaker } from './circuit-breaker';

// Mock the circuit breaker
jest.mock('./circuit-breaker', () => {
  const mockCircuitBreaker = {
    getState: jest.fn().mockReturnValue('CLOSED'),
    canRequest: jest.fn().mockReturnValue(true),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
    reset: jest.fn(),
    resetAll: jest.fn(),
  };

  return {
    remoteCircuitBreaker: mockCircuitBreaker,
    CircuitBreaker: jest.fn().mockImplementation(() => mockCircuitBreaker),
    isRemoteAvailable: jest.fn().mockReturnValue(true),
    getRemoteCircuitState: jest.fn().mockReturnValue('CLOSED'),
  };
});

describe('Remote Health Check', () => {
  const mockMfeConfig: MfeConfig = {
    name: 'testMfe',
    baseUrl: 'http://localhost:4201',
  };

  const mockHealthResponse: RemoteHealthResponse = {
    status: 'healthy',
    name: 'testMfe',
    version: '1.0.0',
    timestamp: Date.now(),
    message: 'Test MFE is ready',
    components: ['TestComponent'],
  };

  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    (remoteCircuitBreaker.getState as jest.Mock).mockReturnValue('CLOSED');
    (remoteCircuitBreaker.canRequest as jest.Mock).mockReturnValue(true);
  });

  describe('checkRemoteHealth', () => {
    it('should return healthy when remote responds with healthy status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(true);
      expect(result.response).toEqual(mockHealthResponse);
      expect(result.error).toBeUndefined();
      expect(remoteCircuitBreaker.recordSuccess).toHaveBeenCalledWith('testMfe');
    });

    it('should return healthy when remote responds with degraded status and acceptDegraded is true', async () => {
      const degradedResponse: RemoteHealthResponse = {
        ...mockHealthResponse,
        status: 'degraded',
        message: 'Running in degraded mode',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(degradedResponse),
      });

      const result = await checkRemoteHealth(mockMfeConfig, {
        fetchFn: mockFetch,
        acceptDegraded: true,
      });

      expect(result.healthy).toBe(true);
      expect(result.response?.status).toBe('degraded');
    });

    it('should return unhealthy when remote responds with degraded status and acceptDegraded is false', async () => {
      const degradedResponse: RemoteHealthResponse = {
        ...mockHealthResponse,
        status: 'degraded',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(degradedResponse),
      });

      const result = await checkRemoteHealth(mockMfeConfig, {
        fetchFn: mockFetch,
        acceptDegraded: false,
      });

      expect(result.healthy).toBe(false);
    });

    it('should return unhealthy when remote responds with unhealthy status', async () => {
      const unhealthyResponse: RemoteHealthResponse = {
        ...mockHealthResponse,
        status: 'unhealthy',
        message: 'Service is down',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unhealthyResponse),
      });

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Service is down');
      expect(remoteCircuitBreaker.recordFailure).toHaveBeenCalled();
    });

    it('should return unhealthy when remote returns non-ok HTTP status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('HTTP 503: Service Unavailable');
      expect(result.statusCode).toBe(503);
      expect(remoteCircuitBreaker.recordFailure).toHaveBeenCalled();
    });

    it('should return unhealthy when fetch throws an error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Network error');
      expect(remoteCircuitBreaker.recordFailure).toHaveBeenCalled();
    });

    it('should return unhealthy when health response has invalid format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Invalid health response format');
    });

    it('should skip health check when circuit breaker is open', async () => {
      (remoteCircuitBreaker.getState as jest.Mock).mockReturnValue('OPEN');

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Circuit breaker is open - remote temporarily blocked');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use custom health path when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const configWithPath: MfeConfig = {
        ...mockMfeConfig,
        healthPath: '/custom/health',
      };

      await checkRemoteHealth(configWithPath, { fetchFn: mockFetch });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4201/custom/health',
        expect.any(Object)
      );
    });

    it('should not update circuit breaker when updateCircuitBreaker is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      await checkRemoteHealth(mockMfeConfig, {
        fetchFn: mockFetch,
        updateCircuitBreaker: false,
      });

      expect(remoteCircuitBreaker.recordSuccess).not.toHaveBeenCalled();
    });

    it('should track duration of health check', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const result = await checkRemoteHealth(mockMfeConfig, { fetchFn: mockFetch });

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkAllRemotesHealth', () => {
    it('should check health of multiple remotes in parallel', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const configs: MfeConfig[] = [
        { name: 'authMfe', baseUrl: 'http://localhost:4201' },
        { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
      ];

      const results = await checkAllRemotesHealth(configs, { fetchFn: mockFetch });

      expect(results.size).toBe(2);
      expect(results.has('authMfe')).toBe(true);
      expect(results.has('paymentsMfe')).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAggregatedHealthStatus', () => {
    it('should return all_healthy when all remotes are healthy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const configs: MfeConfig[] = [
        { name: 'authMfe', baseUrl: 'http://localhost:4201' },
        { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
      ];

      const status = await getAggregatedHealthStatus(configs, { fetchFn: mockFetch });

      expect(status.status).toBe('all_healthy');
      expect(status.healthyCount).toBe(2);
      expect(status.unhealthyCount).toBe(0);
      expect(status.healthyRemotes).toContain('authMfe');
      expect(status.healthyRemotes).toContain('paymentsMfe');
    });

    it('should return all_unhealthy when all remotes are unhealthy', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const configs: MfeConfig[] = [
        { name: 'authMfe', baseUrl: 'http://localhost:4201' },
        { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
      ];

      const status = await getAggregatedHealthStatus(configs, { fetchFn: mockFetch });

      expect(status.status).toBe('all_unhealthy');
      expect(status.healthyCount).toBe(0);
      expect(status.unhealthyCount).toBe(2);
    });

    it('should return some_unhealthy when some remotes are unhealthy', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHealthResponse),
          });
        }
        return Promise.reject(new Error('Network error'));
      });

      const configs: MfeConfig[] = [
        { name: 'authMfe', baseUrl: 'http://localhost:4201' },
        { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
      ];

      const status = await getAggregatedHealthStatus(configs, { fetchFn: mockFetch });

      expect(status.status).toBe('some_unhealthy');
      expect(status.healthyCount).toBe(1);
      expect(status.unhealthyCount).toBe(1);
    });
  });

  describe('getDefaultMfeConfigs', () => {
    it('should return HTTP URLs when not in HTTPS mode', () => {
      const configs = getDefaultMfeConfigs(false);

      expect(configs).toHaveLength(4);
      configs.forEach(config => {
        expect(config.baseUrl).toMatch(/^http:\/\/localhost:\d+$/);
      });
    });

    it('should return HTTPS URLs when in HTTPS mode', () => {
      const configs = getDefaultMfeConfigs(true);

      expect(configs).toHaveLength(4);
      configs.forEach(config => {
        expect(config.baseUrl).toMatch(/^https:\/\/localhost\/mfe\//);
      });
    });

    it('should include all expected MFEs', () => {
      const configs = getDefaultMfeConfigs(false);
      const names = configs.map(c => c.name);

      expect(names).toContain('authMfe');
      expect(names).toContain('paymentsMfe');
      expect(names).toContain('adminMfe');
      expect(names).toContain('profileMfe');
    });
  });

  describe('isRemoteHealthy', () => {
    it('should return true when circuit breaker state is CLOSED', () => {
      (remoteCircuitBreaker.getState as jest.Mock).mockReturnValue('CLOSED');

      expect(isRemoteHealthy('testMfe')).toBe(true);
    });

    it('should return true when circuit breaker state is HALF_OPEN', () => {
      (remoteCircuitBreaker.getState as jest.Mock).mockReturnValue('HALF_OPEN');

      expect(isRemoteHealthy('testMfe')).toBe(true);
    });

    it('should return false when circuit breaker state is OPEN', () => {
      (remoteCircuitBreaker.getState as jest.Mock).mockReturnValue('OPEN');

      expect(isRemoteHealthy('testMfe')).toBe(false);
    });
  });
});
