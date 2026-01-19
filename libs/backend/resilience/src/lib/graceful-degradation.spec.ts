/**
 * Graceful Degradation Tests
 */

import {
  FeatureFlagManager,
  getFeatureFlagManager,
  resetFeatureFlagManager,
  isFeatureEnabled,
  isFeatureDisabled,
  getFeatureFlag,
  setFeatureFlag,
  registerFeatureFlag,
  DegradationFlags,
  initDegradationFlags,
} from './feature-flags';

import {
  createDegradedModeManager,
  HealthLevel,
  createHealthCheckHandlers,
} from './degraded-mode';

describe('Feature Flags', () => {
  beforeEach(() => {
    resetFeatureFlagManager();
  });

  describe('FeatureFlagManager', () => {
    it('should register and get flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('test.flag', true, { description: 'Test flag' });

      expect(manager.get('test.flag')).toBe(true);
      expect(manager.has('test.flag')).toBe(true);
    });

    it('should set and get flag values', () => {
      const manager = new FeatureFlagManager();
      manager.register('test.flag', false);
      manager.set('test.flag', true);

      expect(manager.get('test.flag')).toBe(true);
    });

    it('should check if flag is enabled/disabled', () => {
      const manager = new FeatureFlagManager();
      manager.register('enabled.flag', true);
      manager.register('disabled.flag', false);

      expect(manager.isEnabled('enabled.flag')).toBe(true);
      expect(manager.isDisabled('enabled.flag')).toBe(false);
      expect(manager.isEnabled('disabled.flag')).toBe(false);
      expect(manager.isDisabled('disabled.flag')).toBe(true);
    });

    it('should toggle boolean flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('toggle.flag', false);

      expect(manager.toggle('toggle.flag')).toBe(true);
      expect(manager.get('toggle.flag')).toBe(true);

      expect(manager.toggle('toggle.flag')).toBe(false);
      expect(manager.get('toggle.flag')).toBe(false);
    });

    it('should reset flag to default', () => {
      const manager = new FeatureFlagManager();
      manager.register('reset.flag', true);
      manager.set('reset.flag', false);
      manager.reset('reset.flag');

      expect(manager.get('reset.flag')).toBe(true);
    });

    it('should reset all flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('flag1', true);
      manager.register('flag2', false);
      manager.set('flag1', false);
      manager.set('flag2', true);
      manager.resetAll();

      expect(manager.get('flag1')).toBe(true);
      expect(manager.get('flag2')).toBe(false);
    });

    it('should get flags by category', () => {
      const manager = new FeatureFlagManager();
      manager.register('cat1.flag1', true, { category: 'category1' });
      manager.register('cat1.flag2', true, { category: 'category1' });
      manager.register('cat2.flag1', true, { category: 'category2' });

      const cat1Flags = manager.getByCategory('category1');
      expect(cat1Flags.length).toBe(2);
    });

    it('should get critical flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('critical.flag', true, { isCritical: true });
      manager.register('normal.flag', true, { isCritical: false });

      const critical = manager.getCritical();
      expect(critical.length).toBe(1);
      expect(critical[0].name).toBe('critical.flag');
    });

    it('should support initial flags config', () => {
      const manager = new FeatureFlagManager({
        initialFlags: [
          { name: 'init.flag1', defaultValue: true },
          { name: 'init.flag2', defaultValue: 'value' },
        ],
      });

      expect(manager.get('init.flag1')).toBe(true);
      expect(manager.get('init.flag2')).toBe('value');
    });

    it('should call onFlagChange callback', () => {
      const onChange = jest.fn();
      const manager = new FeatureFlagManager({ onFlagChange: onChange });
      manager.register('callback.flag', false);
      manager.set('callback.flag', true);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'callback.flag', value: true }),
        false
      );
    });

    it('should support subscriptions', () => {
      const manager = new FeatureFlagManager();
      manager.register('sub.flag', false);

      const callback = jest.fn();
      const unsubscribe = manager.subscribe('sub.flag', callback);

      manager.set('sub.flag', true);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ name: 'sub.flag' }));

      callback.mockClear();
      unsubscribe();
      manager.set('sub.flag', false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support overrides', () => {
      const manager = new FeatureFlagManager();
      manager.register('override.flag', false);
      manager.addOverride({ pattern: 'override.*', value: true });

      expect(manager.get('override.flag')).toBe(true);
    });

    it('should support conditional overrides', () => {
      const manager = new FeatureFlagManager();
      manager.register('cond.flag', false);

      let condition = false;
      manager.addOverride({
        pattern: 'cond.flag',
        value: true,
        condition: () => condition,
      });

      expect(manager.get('cond.flag')).toBe(false);

      condition = true;
      expect(manager.get('cond.flag')).toBe(true);
    });

    it('should export and import flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('export.flag1', true);
      manager.register('export.flag2', 'value');

      const exported = manager.export();
      expect(exported['export.flag1']).toBe(true);
      expect(exported['export.flag2']).toBe('value');

      manager.set('export.flag1', false);
      manager.import({ 'export.flag1': true });
      expect(manager.get('export.flag1')).toBe(true);
    });

    it('should get stats', () => {
      const manager = new FeatureFlagManager();
      manager.register('stats.flag1', true, { category: 'cat1' });
      manager.register('stats.flag2', false, { category: 'cat1' });
      manager.register('stats.flag3', true, { category: 'cat2' });

      const stats = manager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.enabled).toBe(2);
      expect(stats.disabled).toBe(1);
      expect(stats.byCategory['cat1']).toBe(2);
      expect(stats.byCategory['cat2']).toBe(1);
    });

    it('should remove flags', () => {
      const manager = new FeatureFlagManager();
      manager.register('remove.flag', true);
      expect(manager.has('remove.flag')).toBe(true);

      manager.remove('remove.flag');
      expect(manager.has('remove.flag')).toBe(false);
    });
  });

  describe('Global Feature Flag Functions', () => {
    beforeEach(() => {
      resetFeatureFlagManager();
    });

    it('should get/create global manager', () => {
      const manager1 = getFeatureFlagManager();
      const manager2 = getFeatureFlagManager();
      expect(manager1).toBe(manager2);
    });

    it('should use convenience functions', () => {
      registerFeatureFlag('conv.flag', true);
      expect(isFeatureEnabled('conv.flag')).toBe(true);
      expect(isFeatureDisabled('conv.flag')).toBe(false);

      setFeatureFlag('conv.flag', false);
      expect(getFeatureFlag('conv.flag')).toBe(false);
    });
  });

  describe('Degradation Flags', () => {
    beforeEach(() => {
      resetFeatureFlagManager();
    });

    it('should initialize standard degradation flags', () => {
      initDegradationFlags();
      const manager = getFeatureFlagManager();

      expect(manager.isEnabled(DegradationFlags.PAYMENTS_ENABLED)).toBe(true);
      expect(manager.isEnabled(DegradationFlags.NOTIFICATIONS_ENABLED)).toBe(true);
      expect(manager.isDisabled(DegradationFlags.USE_CACHED_DATA)).toBe(true);
      expect(manager.isDisabled(DegradationFlags.REJECT_NEW_CONNECTIONS)).toBe(true);
    });
  });
});

describe('Degraded Mode Manager', () => {
  beforeEach(() => {
    resetFeatureFlagManager();
  });

  describe('Health Levels', () => {
    it('should start in healthy state', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      expect(manager.isHealthy()).toBe(true);
      expect(manager.isDegraded()).toBe(false);
      expect(manager.isReady()).toBe(true);
      expect(manager.isLive()).toBe(true);
    });

    it('should enter degraded mode manually', () => {
      const onDegraded = jest.fn();
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        onDegraded,
      });

      manager.enterDegradedMode('test reason');

      expect(manager.isDegraded()).toBe(true);
      expect(manager.isHealthy()).toBe(false);
      expect(manager.isReady()).toBe(true);
      expect(onDegraded).toHaveBeenCalled();
    });

    it('should exit degraded mode manually', () => {
      const onRecovered = jest.fn();
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        onRecovered,
      });

      manager.enterDegradedMode();
      manager.exitDegradedMode();

      expect(manager.isHealthy()).toBe(true);
      expect(manager.isDegraded()).toBe(false);
      expect(onRecovered).toHaveBeenCalled();
    });
  });

  describe('Component Health', () => {
    it('should register and check components', async () => {
      const healthCheck = jest.fn().mockResolvedValue(true);
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'database', healthCheck, isCritical: true },
        ],
      });

      const result = await manager.performHealthCheck();

      expect(result.level).toBe(HealthLevel.HEALTHY);
      expect(result.components['database'].isHealthy).toBe(true);
      expect(healthCheck).toHaveBeenCalled();
    });

    it('should detect unhealthy components', async () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'database', healthCheck: async () => false, isCritical: false },
        ],
      });

      const result = await manager.performHealthCheck();

      expect(result.level).toBe(HealthLevel.DEGRADED);
      expect(result.isDegraded).toBe(true);
    });

    it('should detect critical component failure', async () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'database', healthCheck: async () => false, isCritical: true },
        ],
      });

      const result = await manager.performHealthCheck();

      expect(result.level).toBe(HealthLevel.UNHEALTHY);
      expect(result.isReady).toBe(false);
    });

    it('should handle health check timeout', async () => {
      jest.useFakeTimers();

      const slowHealthCheck = () => new Promise<boolean>((resolve) => {
        // This timer would be 10s in real time
        setTimeout(() => resolve(true), 10000);
      });

      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'slow', healthCheck: slowHealthCheck, timeoutMs: 100 },
        ],
      });

      const resultPromise = manager.performHealthCheck();

      // Advance timers to trigger the timeout (100ms component timeout)
      jest.advanceTimersByTime(150);

      const result = await resultPromise;

      expect(result.components['slow'].isHealthy).toBe(false);
      expect(result.components['slow'].lastError).toContain('timeout');

      // Advance remaining timers to clean up the 10s timer
      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should unregister components', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'comp1', healthCheck: async () => true },
        ],
      });

      expect(manager.unregisterComponent('comp1')).toBe(true);
      expect(manager.unregisterComponent('comp1')).toBe(false);
    });
  });

  describe('Auto-disable Features', () => {
    it('should auto-disable non-critical features when degraded', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        autoDisableFeatures: true,
      });

      const flags = manager.getFeatureFlags();
      expect(flags.isEnabled(DegradationFlags.NOTIFICATIONS_ENABLED)).toBe(true);

      manager.enterDegradedMode();

      expect(flags.isDisabled(DegradationFlags.NOTIFICATIONS_ENABLED)).toBe(true);
      expect(flags.isDisabled(DegradationFlags.ANALYTICS_ENABLED)).toBe(true);
      expect(flags.isEnabled(DegradationFlags.USE_CACHED_DATA)).toBe(true);
    });

    it('should re-enable features on recovery', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        autoDisableFeatures: true,
      });

      manager.enterDegradedMode();
      manager.exitDegradedMode();

      const flags = manager.getFeatureFlags();
      expect(flags.isEnabled(DegradationFlags.NOTIFICATIONS_ENABLED)).toBe(true);
      expect(flags.isDisabled(DegradationFlags.USE_CACHED_DATA)).toBe(true);
    });
  });

  describe('Recovery State', () => {
    it('should track recovery state', async () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service-recovery',
        recoveryThreshold: 3,
        components: [
          { name: 'failing-comp', healthCheck: async () => false, isCritical: false },
        ],
      });

      // Trigger degraded mode through health check (which sets recovery state)
      await manager.performHealthCheck();

      const state = manager.getRecoveryState();
      expect(state.inProgress).toBe(true);
      expect(state.totalChecksNeeded).toBe(3);
      expect(state.successfulChecks).toBe(0);
    });

    it('should calculate recovery progress', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      expect(manager.getHealth().recoveryProgress).toBe(100);

      manager.enterDegradedMode();
      expect(manager.getHealth().recoveryProgress).toBe(0);
    });
  });

  describe('Health Check Result', () => {
    it('should return complete health check result', async () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        components: [
          { name: 'comp1', healthCheck: async () => true },
        ],
      });

      const result = await manager.performHealthCheck();

      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('isLive');
      expect(result).toHaveProperty('isReady');
      expect(result).toHaveProperty('isDegraded');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('activeDegradations');
      expect(result).toHaveProperty('recoveryProgress');
      expect(result).toHaveProperty('message');
    });

    it('should report active degradations', async () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      const flags = manager.getFeatureFlags();
      flags.enable(DegradationFlags.USE_CACHED_DATA);
      flags.disable(DegradationFlags.PAYMENTS_ENABLED);

      const result = await manager.performHealthCheck();

      expect(result.activeDegradations).toContain(DegradationFlags.USE_CACHED_DATA);
      expect(result.activeDegradations).toContain(DegradationFlags.PAYMENTS_ENABLED);
    });
  });

  describe('Health Check Handlers', () => {
    it('should create health check handlers', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      const handlers = createHealthCheckHandlers({ manager });

      expect(handlers.live).toBeDefined();
      expect(handlers.ready).toBeDefined();
      expect(handlers.health).toBeDefined();
    });

    it('should return 200 for live when healthy', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      const handlers = createHealthCheckHandlers({ manager });
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handlers.live({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ok',
      }));
    });

    it('should return 200 for ready when healthy', () => {
      const manager = createDegradedModeManager({
        serviceName: 'test-service',
      });

      const handlers = createHealthCheckHandlers({ manager });
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handlers.ready({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Start/Stop', () => {
    it('should start and stop health monitoring', () => {
      jest.useFakeTimers();

      const manager = createDegradedModeManager({
        serviceName: 'test-service',
        healthCheckIntervalMs: 1000,
        recoveryCheckIntervalMs: 500,
      });

      manager.start();

      // Fast-forward time
      jest.advanceTimersByTime(2000);

      manager.stop();

      jest.useRealTimers();
    });
  });
});
