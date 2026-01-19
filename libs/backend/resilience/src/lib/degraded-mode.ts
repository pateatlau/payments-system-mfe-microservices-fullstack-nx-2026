/**
 * Degraded Mode Manager
 *
 * Provides graceful degradation capabilities:
 * - Health check levels (live, ready, degraded)
 * - Auto-recovery monitoring
 * - Automatic feature disabling under load
 * - Cached data fallback
 *
 * Phase 5.3 - Service Resilience
 */

import { Gauge, Counter, Registry } from 'prom-client';
import {
  FeatureFlagManager,
  getFeatureFlagManager,
  DegradationFlags,
  initDegradationFlags,
} from './feature-flags';
import { CircuitState, getCircuitState, getAllCircuitBreakers } from './circuit-breaker';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Health check levels
 */
export enum HealthLevel {
  /** Service is fully operational */
  HEALTHY = 'healthy',
  /** Service is operational but some features may be degraded */
  DEGRADED = 'degraded',
  /** Service is ready to accept traffic but not fully operational */
  READY = 'ready',
  /** Service is alive but not ready to serve traffic */
  LIVE = 'live',
  /** Service is unhealthy */
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Overall health level */
  level: HealthLevel;
  /** Whether the service is live (basic liveness) */
  isLive: boolean;
  /** Whether the service is ready to serve traffic */
  isReady: boolean;
  /** Whether the service is in degraded mode */
  isDegraded: boolean;
  /** Timestamp of check */
  timestamp: Date;
  /** Individual component health */
  components: Record<string, ComponentHealth>;
  /** Active degradation flags */
  activeDegradations: string[];
  /** Recovery progress (0-100%) */
  recoveryProgress: number;
  /** Estimated time to recovery (ms) */
  estimatedRecoveryMs?: number;
  /** Human-readable message */
  message: string;
}

/**
 * Component health status
 */
export interface ComponentHealth {
  /** Component name */
  name: string;
  /** Component health level */
  level: HealthLevel;
  /** Whether component is healthy */
  isHealthy: boolean;
  /** Last error if unhealthy */
  lastError?: string;
  /** Last check timestamp */
  lastChecked: Date;
  /** Response time in ms */
  responseTimeMs?: number;
}

/**
 * Degraded mode configuration
 */
export interface DegradedModeConfig {
  /** Service name */
  serviceName: string;
  /** Health check interval in ms (default: 10000) */
  healthCheckIntervalMs?: number;
  /** Recovery check interval in ms (default: 5000) */
  recoveryCheckIntervalMs?: number;
  /** Number of successful checks before recovery (default: 3) */
  recoveryThreshold?: number;
  /** Auto-disable non-critical features when degraded (default: true) */
  autoDisableFeatures?: boolean;
  /** Components to monitor */
  components?: ComponentConfig[];
  /** Callback when degraded mode is entered */
  onDegraded?: (result: HealthCheckResult) => void;
  /** Callback when recovered from degraded mode */
  onRecovered?: (result: HealthCheckResult) => void;
  /** Callback on health check */
  onHealthCheck?: (result: HealthCheckResult) => void;
}

/**
 * Component configuration
 */
export interface ComponentConfig {
  /** Component name */
  name: string;
  /** Health check function */
  healthCheck: () => Promise<boolean>;
  /** Whether component is critical (affects readiness) */
  isCritical?: boolean;
  /** Timeout for health check in ms */
  timeoutMs?: number;
  /** Circuit breaker name to monitor (optional) */
  circuitBreakerName?: string;
}

/**
 * Recovery state
 */
interface RecoveryState {
  /** Is recovery in progress */
  inProgress: boolean;
  /** Successful recovery checks */
  successfulChecks: number;
  /** Total checks needed */
  totalChecksNeeded: number;
  /** Start time */
  startTime?: Date;
  /** Last check time */
  lastCheckTime?: Date;
}

// ============================================================================
// Degraded Mode Manager
// ============================================================================

/**
 * Degraded Mode Manager
 * Manages graceful degradation and auto-recovery
 */
export class DegradedModeManager {
  private readonly config: Required<Omit<DegradedModeConfig, 'components' | 'onDegraded' | 'onRecovered' | 'onHealthCheck'>> & DegradedModeConfig;
  private readonly featureFlags: FeatureFlagManager;
  private components: Map<string, ComponentConfig> = new Map();
  private componentHealth: Map<string, ComponentHealth> = new Map();
  private recoveryState: RecoveryState = {
    inProgress: false,
    successfulChecks: 0,
    totalChecksNeeded: 3,
  };
  private currentHealthLevel: HealthLevel = HealthLevel.HEALTHY;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private recoveryCheckInterval: NodeJS.Timeout | null = null;
  private metrics: {
    healthLevel: Gauge;
    degradedTotal: Counter;
    recoveredTotal: Counter;
    componentHealth: Gauge;
  } | null = null;

  constructor(config: DegradedModeConfig) {
    this.config = {
      healthCheckIntervalMs: 10000,
      recoveryCheckIntervalMs: 5000,
      recoveryThreshold: 3,
      autoDisableFeatures: true,
      ...config,
    };

    this.featureFlags = getFeatureFlagManager({ serviceName: config.serviceName });
    this.recoveryState.totalChecksNeeded = this.config.recoveryThreshold;

    // Initialize degradation flags
    initDegradationFlags(this.featureFlags);

    // Register components
    if (config.components) {
      for (const component of config.components) {
        this.registerComponent(component);
      }
    }
  }

  /**
   * Initialize Prometheus metrics
   */
  initMetrics(registry?: Registry): void {
    const reg = registry || new Registry();

    this.metrics = {
      healthLevel: new Gauge({
        name: 'service_health_level',
        help: 'Current service health level (0=unhealthy, 1=live, 2=ready, 3=degraded, 4=healthy)',
        labelNames: ['service'],
        registers: [reg],
      }),

      degradedTotal: new Counter({
        name: 'service_degraded_total',
        help: 'Total times service entered degraded mode',
        labelNames: ['service'],
        registers: [reg],
      }),

      recoveredTotal: new Counter({
        name: 'service_recovered_total',
        help: 'Total times service recovered from degraded mode',
        labelNames: ['service'],
        registers: [reg],
      }),

      componentHealth: new Gauge({
        name: 'component_health',
        help: 'Component health status (0=unhealthy, 1=healthy)',
        labelNames: ['service', 'component'],
        registers: [reg],
      }),
    };

    this.updateMetrics();
  }

  /**
   * Register a component for health monitoring
   */
  registerComponent(component: ComponentConfig): void {
    this.components.set(component.name, component);
    this.componentHealth.set(component.name, {
      name: component.name,
      level: HealthLevel.HEALTHY,
      isHealthy: true,
      lastChecked: new Date(),
    });
  }

  /**
   * Unregister a component
   */
  unregisterComponent(name: string): boolean {
    this.componentHealth.delete(name);
    return this.components.delete(name);
  }

  /**
   * Start health monitoring
   */
  start(): void {
    // Perform initial health check
    this.performHealthCheck();

    // Start periodic health checks
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckIntervalMs
    );

    // Start recovery monitoring
    this.recoveryCheckInterval = setInterval(
      () => this.checkRecovery(),
      this.config.recoveryCheckIntervalMs
    );
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.recoveryCheckInterval) {
      clearInterval(this.recoveryCheckInterval);
      this.recoveryCheckInterval = null;
    }
  }

  /**
   * Perform a health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date();
    const componentResults: Record<string, ComponentHealth> = {};
    let hasUnhealthyComponent = false;
    let hasUnhealthyCritical = false;

    // Check all components
    for (const [name, component] of this.components) {
      const health = await this.checkComponent(component);
      componentResults[name] = health;
      this.componentHealth.set(name, health);

      if (!health.isHealthy) {
        hasUnhealthyComponent = true;
        if (component.isCritical) {
          hasUnhealthyCritical = true;
        }
      }
    }

    // Check circuit breakers
    const circuitBreakerHealth = this.checkCircuitBreakers();

    // Determine health level
    let level: HealthLevel;
    if (hasUnhealthyCritical) {
      level = HealthLevel.UNHEALTHY;
    } else if (hasUnhealthyComponent || circuitBreakerHealth.hasOpenCircuits) {
      level = HealthLevel.DEGRADED;
    } else if (this.recoveryState.inProgress) {
      level = HealthLevel.READY;
    } else {
      level = HealthLevel.HEALTHY;
    }

    // Get active degradations
    const activeDegradations = this.getActiveDegradations();

    // Calculate recovery progress
    const recoveryProgress = this.calculateRecoveryProgress();

    // Build result
    const result: HealthCheckResult = {
      level,
      isLive: level !== HealthLevel.UNHEALTHY,
      isReady: level === HealthLevel.HEALTHY || level === HealthLevel.DEGRADED || level === HealthLevel.READY,
      isDegraded: level === HealthLevel.DEGRADED,
      timestamp,
      components: componentResults,
      activeDegradations,
      recoveryProgress,
      message: this.getHealthMessage(level, componentResults),
    };

    // Handle level changes
    if (level !== this.currentHealthLevel) {
      this.handleHealthLevelChange(this.currentHealthLevel, level, result);
    }

    this.currentHealthLevel = level;
    this.updateMetrics();

    // Call callback
    if (this.config.onHealthCheck) {
      this.config.onHealthCheck(result);
    }

    return result;
  }

  /**
   * Get current health status without running checks
   */
  getHealth(): HealthCheckResult {
    const componentResults: Record<string, ComponentHealth> = {};
    for (const [name, health] of this.componentHealth) {
      componentResults[name] = health;
    }

    return {
      level: this.currentHealthLevel,
      isLive: this.currentHealthLevel !== HealthLevel.UNHEALTHY,
      isReady: this.currentHealthLevel === HealthLevel.HEALTHY || this.currentHealthLevel === HealthLevel.DEGRADED || this.currentHealthLevel === HealthLevel.READY,
      isDegraded: this.currentHealthLevel === HealthLevel.DEGRADED,
      timestamp: new Date(),
      components: componentResults,
      activeDegradations: this.getActiveDegradations(),
      recoveryProgress: this.calculateRecoveryProgress(),
      message: this.getHealthMessage(this.currentHealthLevel, componentResults),
    };
  }

  /**
   * Enter degraded mode manually
   */
  enterDegradedMode(reason: string = 'manual'): void {
    if (this.currentHealthLevel === HealthLevel.DEGRADED) return;

    this.currentHealthLevel = HealthLevel.DEGRADED;

    if (this.config.autoDisableFeatures) {
      this.disableNonCriticalFeatures();
    }

    const result = this.getHealth();
    result.message = `Entered degraded mode: ${reason}`;

    if (this.config.onDegraded) {
      this.config.onDegraded(result);
    }

    if (this.metrics) {
      this.metrics.degradedTotal.inc({ service: this.config.serviceName });
    }
  }

  /**
   * Exit degraded mode manually
   */
  exitDegradedMode(): void {
    if (this.currentHealthLevel !== HealthLevel.DEGRADED) return;

    this.currentHealthLevel = HealthLevel.HEALTHY;
    this.enableAllFeatures();

    const result = this.getHealth();
    result.message = 'Exited degraded mode';

    if (this.config.onRecovered) {
      this.config.onRecovered(result);
    }

    if (this.metrics) {
      this.metrics.recoveredTotal.inc({ service: this.config.serviceName });
    }
  }

  /**
   * Check if service is in degraded mode
   */
  isDegraded(): boolean {
    return this.currentHealthLevel === HealthLevel.DEGRADED;
  }

  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    return this.currentHealthLevel === HealthLevel.HEALTHY;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.currentHealthLevel !== HealthLevel.UNHEALTHY &&
           this.currentHealthLevel !== HealthLevel.LIVE;
  }

  /**
   * Check if service is live
   */
  isLive(): boolean {
    return this.currentHealthLevel !== HealthLevel.UNHEALTHY;
  }

  /**
   * Get feature flag manager
   */
  getFeatureFlags(): FeatureFlagManager {
    return this.featureFlags;
  }

  /**
   * Get recovery state
   */
  getRecoveryState(): RecoveryState {
    return { ...this.recoveryState };
  }

  // Private methods

  private async checkComponent(component: ComponentConfig): Promise<ComponentHealth> {
    const startTime = Date.now();
    let isHealthy = false;
    let lastError: string | undefined;

    try {
      // Check circuit breaker first if configured
      if (component.circuitBreakerName) {
        const circuitState = getCircuitState(component.circuitBreakerName);
        if (circuitState === CircuitState.OPEN) {
          return {
            name: component.name,
            level: HealthLevel.UNHEALTHY,
            isHealthy: false,
            lastError: 'Circuit breaker is open',
            lastChecked: new Date(),
          };
        }
      }

      // Run health check with timeout
      const timeoutMs = component.timeoutMs ?? 5000;
      const checkPromise = component.healthCheck();
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      );

      isHealthy = await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
      isHealthy = false;
      lastError = error instanceof Error ? error.message : String(error);
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      name: component.name,
      level: isHealthy ? HealthLevel.HEALTHY : HealthLevel.UNHEALTHY,
      isHealthy,
      lastError,
      lastChecked: new Date(),
      responseTimeMs,
    };
  }

  private checkCircuitBreakers(): { hasOpenCircuits: boolean; openCircuits: string[] } {
    const breakers = getAllCircuitBreakers();
    const openCircuits: string[] = [];

    for (const [name] of breakers) {
      const state = getCircuitState(name);
      if (state === CircuitState.OPEN) {
        openCircuits.push(name);
      }
    }

    return {
      hasOpenCircuits: openCircuits.length > 0,
      openCircuits,
    };
  }

  private getActiveDegradations(): string[] {
    const degradations: string[] = [];
    const flags = this.featureFlags.getAll();

    for (const flag of flags) {
      if (flag.category === 'fallback' && flag.value === true) {
        degradations.push(flag.name);
      }
      if (flag.category === 'loadshed' && flag.value === true) {
        degradations.push(flag.name);
      }
      if (flag.category === 'service' && flag.value === false) {
        degradations.push(flag.name);
      }
    }

    return degradations;
  }

  private calculateRecoveryProgress(): number {
    if (!this.recoveryState.inProgress) {
      return this.currentHealthLevel === HealthLevel.HEALTHY ? 100 : 0;
    }

    return Math.floor((this.recoveryState.successfulChecks / this.recoveryState.totalChecksNeeded) * 100);
  }

  private getHealthMessage(level: HealthLevel, _components: Record<string, ComponentHealth>): string {
    switch (level) {
      case HealthLevel.HEALTHY:
        return 'All systems operational';
      case HealthLevel.DEGRADED:
        return 'Service is operating in degraded mode';
      case HealthLevel.READY:
        return 'Service is ready but recovering';
      case HealthLevel.LIVE:
        return 'Service is alive but not ready';
      case HealthLevel.UNHEALTHY:
        return 'Service is unhealthy';
      default:
        return 'Unknown health status';
    }
  }

  private handleHealthLevelChange(oldLevel: HealthLevel, newLevel: HealthLevel, result: HealthCheckResult): void {
    // Entering degraded mode
    if (newLevel === HealthLevel.DEGRADED && oldLevel !== HealthLevel.DEGRADED) {
      if (this.config.autoDisableFeatures) {
        this.disableNonCriticalFeatures();
      }

      this.recoveryState = {
        inProgress: true,
        successfulChecks: 0,
        totalChecksNeeded: this.config.recoveryThreshold,
        startTime: new Date(),
      };

      if (this.config.onDegraded) {
        this.config.onDegraded(result);
      }

      if (this.metrics) {
        this.metrics.degradedTotal.inc({ service: this.config.serviceName });
      }
    }

    // Recovering from degraded mode
    if (newLevel === HealthLevel.HEALTHY && oldLevel === HealthLevel.DEGRADED) {
      this.enableAllFeatures();

      this.recoveryState = {
        inProgress: false,
        successfulChecks: 0,
        totalChecksNeeded: this.config.recoveryThreshold,
      };

      if (this.config.onRecovered) {
        this.config.onRecovered(result);
      }

      if (this.metrics) {
        this.metrics.recoveredTotal.inc({ service: this.config.serviceName });
      }
    }
  }

  private async checkRecovery(): Promise<void> {
    if (!this.recoveryState.inProgress) return;
    if (this.currentHealthLevel !== HealthLevel.DEGRADED) return;

    // Perform a health check
    let allHealthy = true;
    for (const [, component] of this.components) {
      const health = await this.checkComponent(component);
      if (!health.isHealthy && component.isCritical !== false) {
        allHealthy = false;
        break;
      }
    }

    // Check circuit breakers
    const { hasOpenCircuits } = this.checkCircuitBreakers();
    if (hasOpenCircuits) {
      allHealthy = false;
    }

    if (allHealthy) {
      this.recoveryState.successfulChecks++;
      this.recoveryState.lastCheckTime = new Date();

      if (this.recoveryState.successfulChecks >= this.recoveryState.totalChecksNeeded) {
        // Recovery complete
        this.currentHealthLevel = HealthLevel.HEALTHY;
        this.enableAllFeatures();

        this.recoveryState = {
          inProgress: false,
          successfulChecks: 0,
          totalChecksNeeded: this.config.recoveryThreshold,
        };

        const result = this.getHealth();
        if (this.config.onRecovered) {
          this.config.onRecovered(result);
        }

        if (this.metrics) {
          this.metrics.recoveredTotal.inc({ service: this.config.serviceName });
        }
      }
    } else {
      // Reset recovery progress
      this.recoveryState.successfulChecks = 0;
    }
  }

  private disableNonCriticalFeatures(): void {
    this.featureFlags.disable(DegradationFlags.NOTIFICATIONS_ENABLED, 'degraded-mode');
    this.featureFlags.disable(DegradationFlags.ANALYTICS_ENABLED, 'degraded-mode');
    this.featureFlags.disable(DegradationFlags.WEBHOOKS_ENABLED, 'degraded-mode');
    this.featureFlags.disable(DegradationFlags.REAL_TIME_UPDATES, 'degraded-mode');
    this.featureFlags.disable(DegradationFlags.DETAILED_LOGGING, 'degraded-mode');
    this.featureFlags.enable(DegradationFlags.USE_CACHED_DATA, 'degraded-mode');
  }

  private enableAllFeatures(): void {
    this.featureFlags.enable(DegradationFlags.NOTIFICATIONS_ENABLED, 'recovery');
    this.featureFlags.enable(DegradationFlags.ANALYTICS_ENABLED, 'recovery');
    this.featureFlags.enable(DegradationFlags.WEBHOOKS_ENABLED, 'recovery');
    this.featureFlags.enable(DegradationFlags.REAL_TIME_UPDATES, 'recovery');
    this.featureFlags.enable(DegradationFlags.DETAILED_LOGGING, 'recovery');
    this.featureFlags.disable(DegradationFlags.USE_CACHED_DATA, 'recovery');
  }

  private updateMetrics(): void {
    if (!this.metrics) return;

    const levelValue = {
      [HealthLevel.UNHEALTHY]: 0,
      [HealthLevel.LIVE]: 1,
      [HealthLevel.READY]: 2,
      [HealthLevel.DEGRADED]: 3,
      [HealthLevel.HEALTHY]: 4,
    };

    this.metrics.healthLevel.set(
      { service: this.config.serviceName },
      levelValue[this.currentHealthLevel]
    );

    for (const [name, health] of this.componentHealth) {
      this.metrics.componentHealth.set(
        { service: this.config.serviceName, component: name },
        health.isHealthy ? 1 : 0
      );
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a degraded mode manager
 */
export function createDegradedModeManager(config: DegradedModeConfig): DegradedModeManager {
  return new DegradedModeManager(config);
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Health check middleware configuration
 */
export interface HealthMiddlewareConfig {
  /** Degraded mode manager */
  manager: DegradedModeManager;
  /** Path for liveness probe (default: /health/live) */
  livePath?: string;
  /** Path for readiness probe (default: /health/ready) */
  readyPath?: string;
  /** Path for full health check (default: /health) */
  healthPath?: string;
}

/**
 * Create Express health check routes
 * Returns an object with route handlers for live, ready, and health endpoints
 */
export function createHealthCheckHandlers(config: HealthMiddlewareConfig): {
  live: (req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => void;
  ready: (req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => void;
  health: (req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => Promise<void>;
} {
  const { manager } = config;

  return {
    live: (_req, res) => {
      const isLive = manager.isLive();
      res.status(isLive ? 200 : 503).json({
        status: isLive ? 'ok' : 'error',
        level: manager.getHealth().level,
      });
    },

    ready: (_req, res) => {
      const isReady = manager.isReady();
      res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ok' : 'error',
        level: manager.getHealth().level,
      });
    },

    health: async (_req, res) => {
      const result = await manager.performHealthCheck();
      const statusCode = result.level === HealthLevel.HEALTHY ? 200 :
                         result.level === HealthLevel.DEGRADED ? 200 :
                         result.level === HealthLevel.READY ? 200 : 503;

      res.status(statusCode).json({
        status: result.isReady ? 'ok' : 'error',
        ...result,
      });
    },
  };
}
