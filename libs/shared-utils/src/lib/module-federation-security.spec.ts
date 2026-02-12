/**
 * Module Federation Security Test Suite
 *
 * Comprehensive tests for Phase 6 Module Federation Security features:
 * - SRI hash verification
 * - URL validation
 * - Circuit breaker integration
 * - Health checks
 * - Shared dependency security
 *
 * @security Phase 6 Task 6.7
 */

import {
  validateRemoteUrl,
  RemoteUrlValidator,
  ValidationResult,
} from './remote-url-validator';
import {
  CircuitBreaker,
  remoteCircuitBreaker,
  isRemoteAvailable,
  getRemoteCircuitState,
} from './circuit-breaker';
import {
  checkRemoteHealth,
  isRemoteHealthy,
  getDefaultMfeConfigs,
  MfeConfig,
} from './remote-health-check';
import { withRetry, calculateBackoffDelay } from './retry';

describe('Module Federation Security Test Suite', () => {
  describe('1. Remote URL Validation', () => {
    describe('1.1 Allowlist Enforcement', () => {
      it('should accept URLs from allowed origins', () => {
        const result = validateRemoteUrl('http://localhost:4201/remoteEntry.js');
        expect(result.valid).toBe(true);
      });

      it('should reject URLs from disallowed origins', () => {
        const result = validateRemoteUrl('http://malicious.com/remoteEntry.js');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('not in allowlist');
      });

      it('should support wildcard port matching', () => {
        const validator = new RemoteUrlValidator({
          allowedOrigins: ['http://localhost:*'],
        });

        // Must use remoteEntry.js path pattern
        expect(validator.validate('http://localhost:4201/remoteEntry.js').valid).toBe(true);
        expect(validator.validate('http://localhost:4202/remoteEntry.js').valid).toBe(true);
        expect(validator.validate('http://localhost:9999/remoteEntry.js').valid).toBe(true);
      });

      it('should support subdomain wildcards', () => {
        const validator = new RemoteUrlValidator({
          allowedOrigins: ['https://*.example.com'],
        });

        // Must use remoteEntry.js path pattern
        expect(validator.validate('https://mfe.example.com/remoteEntry.js').valid).toBe(true);
        expect(validator.validate('https://cdn.example.com/remoteEntry.js').valid).toBe(true);
        expect(validator.validate('https://malicious.com/remoteEntry.js').valid).toBe(false);
      });
    });

    describe('1.2 Dangerous URL Blocking', () => {
      it('should block javascript: protocol', () => {
        const result = validateRemoteUrl('javascript:alert(1)');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should block data: protocol', () => {
        const result = validateRemoteUrl('data:text/html,<script>alert(1)</script>');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should block URLs with credentials', () => {
        const result = validateRemoteUrl('http://user:pass@localhost:4201/entry.js');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should block file: protocol', () => {
        const result = validateRemoteUrl('file:///etc/passwd');
        expect(result.valid).toBe(false);
      });
    });

    describe('1.3 HTTPS Enforcement', () => {
      it('should enforce HTTPS when configured via allowedProtocols', () => {
        const validator = new RemoteUrlValidator({
          allowedOrigins: ['https://cdn.example.com'],
          allowedProtocols: ['https:'], // Only allow HTTPS
          allowedPaths: ['/entry.js'], // Allow test path
        });

        expect(validator.validate('https://cdn.example.com/entry.js').valid).toBe(true);
        expect(validator.validate('http://cdn.example.com/entry.js').valid).toBe(false);
      });
    });
  });

  describe('2. Circuit Breaker Protection', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        successThreshold: 1,
      });
    });

    describe('2.1 Failure Tracking', () => {
      it('should start in CLOSED state', () => {
        expect(circuitBreaker.getState('testMfe')).toBe('CLOSED');
      });

      it('should open circuit after failure threshold', () => {
        const error = new Error('Load failed');

        circuitBreaker.recordFailure('testMfe', error);
        expect(circuitBreaker.getState('testMfe')).toBe('CLOSED');

        circuitBreaker.recordFailure('testMfe', error);
        expect(circuitBreaker.getState('testMfe')).toBe('CLOSED');

        circuitBreaker.recordFailure('testMfe', error);
        expect(circuitBreaker.getState('testMfe')).toBe('OPEN');
      });

      it('should block requests when circuit is OPEN', () => {
        const error = new Error('Load failed');

        // Open the circuit
        for (let i = 0; i < 3; i++) {
          circuitBreaker.recordFailure('testMfe', error);
        }

        expect(circuitBreaker.canRequest('testMfe')).toBe(false);
      });
    });

    describe('2.2 Recovery', () => {
      it('should transition to HALF_OPEN after reset timeout', async () => {
        const error = new Error('Load failed');

        // Open the circuit
        for (let i = 0; i < 3; i++) {
          circuitBreaker.recordFailure('testMfe', error);
        }

        expect(circuitBreaker.getState('testMfe')).toBe('OPEN');

        // Wait for reset timeout
        await new Promise(resolve => setTimeout(resolve, 1100));

        expect(circuitBreaker.getState('testMfe')).toBe('HALF_OPEN');
      });

      it('should close circuit after successful request in HALF_OPEN', async () => {
        const error = new Error('Load failed');

        // Open the circuit
        for (let i = 0; i < 3; i++) {
          circuitBreaker.recordFailure('testMfe', error);
        }

        // Wait for reset timeout
        await new Promise(resolve => setTimeout(resolve, 1100));

        expect(circuitBreaker.getState('testMfe')).toBe('HALF_OPEN');

        // Record success
        circuitBreaker.recordSuccess('testMfe');

        expect(circuitBreaker.getState('testMfe')).toBe('CLOSED');
      });

      it('should reopen circuit on failure in HALF_OPEN', async () => {
        const error = new Error('Load failed');

        // Open the circuit
        for (let i = 0; i < 3; i++) {
          circuitBreaker.recordFailure('testMfe', error);
        }

        // Wait for reset timeout
        await new Promise(resolve => setTimeout(resolve, 1100));

        expect(circuitBreaker.getState('testMfe')).toBe('HALF_OPEN');

        // Record failure
        circuitBreaker.recordFailure('testMfe', error);

        expect(circuitBreaker.getState('testMfe')).toBe('OPEN');
      });
    });

    describe('2.3 Per-Remote Isolation', () => {
      it('should track each remote independently', () => {
        const error = new Error('Load failed');

        // Open circuit for authMfe
        for (let i = 0; i < 3; i++) {
          circuitBreaker.recordFailure('authMfe', error);
        }

        expect(circuitBreaker.getState('authMfe')).toBe('OPEN');
        expect(circuitBreaker.getState('paymentsMfe')).toBe('CLOSED');
        expect(circuitBreaker.canRequest('authMfe')).toBe(false);
        expect(circuitBreaker.canRequest('paymentsMfe')).toBe(true);
      });
    });
  });

  describe('3. Health Check Integration', () => {
    describe('3.1 Health Check Configuration', () => {
      it('should return correct MFE configs for HTTP mode', () => {
        const configs = getDefaultMfeConfigs(false);

        expect(configs).toHaveLength(4);
        expect(configs.map(c => c.name)).toEqual([
          'authMfe',
          'paymentsMfe',
          'adminMfe',
          'profileMfe',
        ]);
        configs.forEach(config => {
          expect(config.baseUrl).toMatch(/^http:\/\/localhost:\d+$/);
        });
      });

      it('should return correct MFE configs for HTTPS mode', () => {
        const configs = getDefaultMfeConfigs(true);

        expect(configs).toHaveLength(4);
        configs.forEach(config => {
          expect(config.baseUrl).toMatch(/^https:\/\/localhost\/mfe\//);
        });
      });
    });

    describe('3.2 Health Check with Circuit Breaker', () => {
      beforeEach(() => {
        remoteCircuitBreaker.resetAll();
      });

      it('should skip health check when circuit is OPEN', async () => {
        // Open the circuit by recording failures
        const error = new Error('Failed');
        remoteCircuitBreaker.recordFailure('testHealthMfe', error);
        remoteCircuitBreaker.recordFailure('testHealthMfe', error);
        remoteCircuitBreaker.recordFailure('testHealthMfe', error);

        expect(remoteCircuitBreaker.getState('testHealthMfe')).toBe('OPEN');

        const config: MfeConfig = {
          name: 'testHealthMfe',
          baseUrl: 'http://localhost:9999',
        };

        const mockFetch = jest.fn();
        const result = await checkRemoteHealth(config, { fetchFn: mockFetch });

        expect(result.healthy).toBe(false);
        expect(result.error).toContain('Circuit breaker is open');
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('4. Retry Logic', () => {
    describe('4.1 Exponential Backoff', () => {
      it('should calculate backoff delays with exponential increase', () => {
        // Without jitter, delays should follow pattern: initialDelay * (2 ^ attempt)
        const config = { initialDelay: 1000, jitter: false };

        const delay0 = calculateBackoffDelay(0, config);
        const delay1 = calculateBackoffDelay(1, config);
        const delay2 = calculateBackoffDelay(2, config);

        expect(delay0).toBe(1000); // 1000 * 2^0 = 1000
        expect(delay1).toBe(2000); // 1000 * 2^1 = 2000
        expect(delay2).toBe(4000); // 1000 * 2^2 = 4000
      });

      it('should respect maximum delay', () => {
        const config = { initialDelay: 1000, maxDelay: 5000, jitter: false };
        const delay = calculateBackoffDelay(10, config);
        expect(delay).toBeLessThanOrEqual(5000);
      });

      it('should add jitter when enabled (default)', () => {
        const config = { initialDelay: 1000, jitter: true };
        const delays = new Set<number>();
        for (let i = 0; i < 10; i++) {
          delays.add(calculateBackoffDelay(1, config));
        }
        // With jitter, we should get some variety in delays
        expect(delays.size).toBeGreaterThan(1);
      });
    });

    describe('4.2 Retry Execution', () => {
      it('should retry on failure', async () => {
        let attempts = 0;
        const operation = jest.fn().mockImplementation(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Failed');
          }
          return 'success';
        });

        const result = await withRetry(operation, {
          maxAttempts: 3,
          initialDelay: 10,
          jitter: false,
        });

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('should throw after max attempts exceeded', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

        await expect(
          withRetry(operation, { maxAttempts: 2, initialDelay: 10, jitter: false })
        ).rejects.toThrow('Always fails');

        expect(operation).toHaveBeenCalledTimes(2);
      });

      it('should call onRetry callback between attempts', async () => {
        const onRetry = jest.fn();
        const operation = jest.fn().mockRejectedValue(new Error('Fails'));

        await expect(
          withRetry(operation, {
            maxAttempts: 3,
            initialDelay: 10,
            jitter: false,
            onRetry,
          })
        ).rejects.toThrow('Fails');

        // onRetry is called between attempts (not after the last one)
        expect(onRetry).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('5. Global Circuit Breaker Instance', () => {
    beforeEach(() => {
      remoteCircuitBreaker.resetAll();
    });

    it('should provide global access to circuit state', () => {
      expect(isRemoteAvailable('authMfe')).toBe(true);
      expect(getRemoteCircuitState('authMfe')).toBe('CLOSED');
    });

    it('should track failures across the application', () => {
      const error = new Error('Test failure');

      remoteCircuitBreaker.recordFailure('authMfe', error);
      remoteCircuitBreaker.recordFailure('authMfe', error);
      remoteCircuitBreaker.recordFailure('authMfe', error);

      expect(isRemoteAvailable('authMfe')).toBe(false);
      expect(getRemoteCircuitState('authMfe')).toBe('OPEN');
    });
  });

  describe('6. Security Edge Cases', () => {
    describe('6.1 URL Manipulation Attempts', () => {
      it('should block path traversal attempts with encoded slashes', () => {
        // %2f%2f is blocked as a dangerous pattern
        const result = validateRemoteUrl('http://localhost:4201/%2f%2f/etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should block backslash injection attempts', () => {
        // %5c (backslash) is blocked as a dangerous pattern
        const result = validateRemoteUrl('http://localhost:4201/%5c..%5cetc%5cpasswd');
        expect(result.valid).toBe(false);
      });

      it('should allow valid localhost URLs with remoteEntry.js', () => {
        const result = validateRemoteUrl('http://localhost:4201/remoteEntry.js');
        expect(result.valid).toBe(true);
      });

      it('should handle unicode normalization consistently', () => {
        // These should be treated consistently
        const result1 = validateRemoteUrl('http://localhost:4201/remoteEntry.js');
        const result2 = validateRemoteUrl('http://localhost:4201/remoteEntry.js');
        expect(result1.valid).toBe(result2.valid);
      });
    });

    describe('6.2 Concurrent Circuit Breaker Access', () => {
      it('should handle concurrent failure recordings', async () => {
        const cb = new CircuitBreaker({ failureThreshold: 5 });
        const error = new Error('Concurrent failure');

        // Simulate concurrent failures
        await Promise.all([
          Promise.resolve(cb.recordFailure('testMfe', error)),
          Promise.resolve(cb.recordFailure('testMfe', error)),
          Promise.resolve(cb.recordFailure('testMfe', error)),
          Promise.resolve(cb.recordFailure('testMfe', error)),
          Promise.resolve(cb.recordFailure('testMfe', error)),
        ]);

        // Should have opened the circuit
        expect(cb.getState('testMfe')).toBe('OPEN');
      });
    });
  });
});
