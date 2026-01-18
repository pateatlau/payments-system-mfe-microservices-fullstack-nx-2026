/**
 * Feature Flags for Graceful Degradation
 *
 * Provides runtime-configurable feature flags to:
 * - Disable non-critical features under load
 * - Enable/disable features based on system health
 * - Support A/B testing and gradual rollouts
 *
 * Phase 5.3 - Service Resilience
 */

import { Gauge, Registry } from 'prom-client';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Feature flag value types
 */
export type FeatureFlagValue = boolean | string | number;

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  /** Unique flag name */
  name: string;
  /** Current value */
  value: FeatureFlagValue;
  /** Default value when not set */
  defaultValue: FeatureFlagValue;
  /** Description of what the flag controls */
  description?: string;
  /** Whether this flag is critical (affects core functionality) */
  isCritical?: boolean;
  /** Category for grouping flags */
  category?: string;
  /** Timestamp of last change */
  lastUpdated: Date;
  /** Who/what updated it last */
  updatedBy?: string;
}

/**
 * Feature flag configuration
 */
export interface FeatureFlagConfig {
  /** Initial flags to register */
  initialFlags?: Array<{
    name: string;
    defaultValue: FeatureFlagValue;
    description?: string;
    isCritical?: boolean;
    category?: string;
  }>;
  /** Callback when a flag changes */
  onFlagChange?: (flag: FeatureFlag, oldValue: FeatureFlagValue) => void;
  /** Service name for metrics */
  serviceName?: string;
}

/**
 * Feature flag override rule
 */
export interface FeatureFlagOverride {
  /** Flag name pattern (supports * wildcard) */
  pattern: string;
  /** Override value */
  value: FeatureFlagValue;
  /** Condition for override (optional) */
  condition?: () => boolean;
  /** Priority (higher wins) */
  priority?: number;
}

// ============================================================================
// Feature Flag Manager
// ============================================================================

/**
 * Feature Flag Manager
 * Centralized management of feature flags with runtime updates
 */
export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private overrides: FeatureFlagOverride[] = [];
  private listeners: Map<string, Set<(flag: FeatureFlag) => void>> = new Map();
  private readonly config: FeatureFlagConfig;
  private metrics: { flagValue: Gauge } | null = null;

  constructor(config: FeatureFlagConfig = {}) {
    this.config = config;

    // Register initial flags
    if (config.initialFlags) {
      for (const flag of config.initialFlags) {
        this.register(flag.name, flag.defaultValue, {
          description: flag.description,
          isCritical: flag.isCritical,
          category: flag.category,
        });
      }
    }
  }

  /**
   * Initialize Prometheus metrics
   */
  initMetrics(registry?: Registry): void {
    const reg = registry || new Registry();

    this.metrics = {
      flagValue: new Gauge({
        name: 'feature_flag_value',
        help: 'Current feature flag value (1=enabled, 0=disabled for booleans)',
        labelNames: ['service', 'flag', 'category'],
        registers: [reg],
      }),
    };

    // Update metrics for existing flags
    this.updateAllMetrics();
  }

  /**
   * Register a new feature flag
   */
  register(
    name: string,
    defaultValue: FeatureFlagValue,
    options: {
      description?: string;
      isCritical?: boolean;
      category?: string;
    } = {}
  ): void {
    const flag: FeatureFlag = {
      name,
      value: defaultValue,
      defaultValue,
      description: options.description,
      isCritical: options.isCritical ?? false,
      category: options.category ?? 'general',
      lastUpdated: new Date(),
      updatedBy: 'system',
    };

    this.flags.set(name, flag);
    this.updateMetric(flag);
  }

  /**
   * Get a feature flag value
   */
  get<T extends FeatureFlagValue = boolean>(name: string): T | undefined {
    const flag = this.flags.get(name);
    if (!flag) return undefined;

    // Check for overrides
    const override = this.findOverride(name);
    if (override !== undefined) {
      return override as T;
    }

    return flag.value as T;
  }

  /**
   * Get a feature flag value with default
   */
  getOrDefault<T extends FeatureFlagValue>(name: string, defaultValue: T): T {
    const value = this.get<T>(name);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Check if a boolean feature flag is enabled
   */
  isEnabled(name: string): boolean {
    const value = this.get<boolean>(name);
    return value === true;
  }

  /**
   * Check if a boolean feature flag is disabled
   */
  isDisabled(name: string): boolean {
    const value = this.get<boolean>(name);
    return value === false;
  }

  /**
   * Set a feature flag value
   */
  set(name: string, value: FeatureFlagValue, updatedBy: string = 'manual'): void {
    const flag = this.flags.get(name);
    if (!flag) {
      throw new Error(`Feature flag "${name}" not registered`);
    }

    const oldValue = flag.value;
    flag.value = value;
    flag.lastUpdated = new Date();
    flag.updatedBy = updatedBy;

    this.updateMetric(flag);

    // Notify listeners
    this.notifyListeners(name, flag);

    // Call global change callback
    if (this.config.onFlagChange && oldValue !== value) {
      this.config.onFlagChange(flag, oldValue);
    }
  }

  /**
   * Enable a boolean feature flag
   */
  enable(name: string, updatedBy: string = 'manual'): void {
    this.set(name, true, updatedBy);
  }

  /**
   * Disable a boolean feature flag
   */
  disable(name: string, updatedBy: string = 'manual'): void {
    this.set(name, false, updatedBy);
  }

  /**
   * Toggle a boolean feature flag
   */
  toggle(name: string, updatedBy: string = 'manual'): boolean {
    const currentValue = this.get<boolean>(name);
    const newValue = !currentValue;
    this.set(name, newValue, updatedBy);
    return newValue;
  }

  /**
   * Reset a flag to its default value
   */
  reset(name: string, updatedBy: string = 'system'): void {
    const flag = this.flags.get(name);
    if (flag) {
      this.set(name, flag.defaultValue, updatedBy);
    }
  }

  /**
   * Reset all flags to their default values
   */
  resetAll(updatedBy: string = 'system'): void {
    for (const [name] of this.flags) {
      this.reset(name, updatedBy);
    }
  }

  /**
   * Get all feature flags
   */
  getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get all flags in a category
   */
  getByCategory(category: string): FeatureFlag[] {
    return this.getAll().filter(f => f.category === category);
  }

  /**
   * Get all critical flags
   */
  getCritical(): FeatureFlag[] {
    return this.getAll().filter(f => f.isCritical);
  }

  /**
   * Check if a flag exists
   */
  has(name: string): boolean {
    return this.flags.has(name);
  }

  /**
   * Remove a feature flag
   */
  remove(name: string): boolean {
    const deleted = this.flags.delete(name);
    this.listeners.delete(name);
    return deleted;
  }

  /**
   * Add an override rule
   */
  addOverride(override: FeatureFlagOverride): void {
    this.overrides.push(override);
    // Sort by priority (higher first)
    this.overrides.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Remove an override rule
   */
  removeOverride(pattern: string): boolean {
    const index = this.overrides.findIndex(o => o.pattern === pattern);
    if (index >= 0) {
      this.overrides.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = [];
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(name: string, callback: (flag: FeatureFlag) => void): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    this.listeners.get(name)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(name)?.delete(callback);
    };
  }

  /**
   * Subscribe to all flag changes
   */
  subscribeAll(callback: (flag: FeatureFlag) => void): () => void {
    return this.subscribe('*', callback);
  }

  /**
   * Get flag statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byCategory: Record<string, number>;
  } {
    const flags = this.getAll();
    const enabled = flags.filter(f => f.value === true).length;
    const disabled = flags.filter(f => f.value === false).length;

    const byCategory: Record<string, number> = {};
    for (const flag of flags) {
      const category = flag.category ?? 'general';
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }

    return {
      total: flags.length,
      enabled,
      disabled,
      byCategory,
    };
  }

  /**
   * Export flags as JSON
   */
  export(): Record<string, FeatureFlagValue> {
    const result: Record<string, FeatureFlagValue> = {};
    for (const [name, flag] of this.flags) {
      result[name] = flag.value;
    }
    return result;
  }

  /**
   * Import flags from JSON
   */
  import(flags: Record<string, FeatureFlagValue>, updatedBy: string = 'import'): void {
    for (const [name, value] of Object.entries(flags)) {
      if (this.has(name)) {
        this.set(name, value, updatedBy);
      }
    }
  }

  // Private methods

  private findOverride(name: string): FeatureFlagValue | undefined {
    for (const override of this.overrides) {
      if (this.matchesPattern(name, override.pattern)) {
        if (!override.condition || override.condition()) {
          return override.value;
        }
      }
    }
    return undefined;
  }

  private matchesPattern(name: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      return name.startsWith(pattern.slice(0, -1));
    }
    return name === pattern;
  }

  private notifyListeners(name: string, flag: FeatureFlag): void {
    // Notify specific listeners
    const listeners = this.listeners.get(name);
    if (listeners) {
      for (const callback of listeners) {
        callback(flag);
      }
    }

    // Notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      for (const callback of globalListeners) {
        callback(flag);
      }
    }
  }

  private updateMetric(flag: FeatureFlag): void {
    if (!this.metrics) return;

    const numericValue = typeof flag.value === 'boolean'
      ? (flag.value ? 1 : 0)
      : (typeof flag.value === 'number' ? flag.value : 0);

    this.metrics.flagValue.set(
      {
        service: this.config.serviceName ?? 'unknown',
        flag: flag.name,
        category: flag.category ?? 'general',
      },
      numericValue
    );
  }

  private updateAllMetrics(): void {
    for (const flag of this.flags.values()) {
      this.updateMetric(flag);
    }
  }
}

// ============================================================================
// Global Feature Flag Manager
// ============================================================================

let globalFeatureFlagManager: FeatureFlagManager | null = null;

/**
 * Get or create the global feature flag manager
 */
export function getFeatureFlagManager(config?: FeatureFlagConfig): FeatureFlagManager {
  if (!globalFeatureFlagManager) {
    globalFeatureFlagManager = new FeatureFlagManager(config);
  }
  return globalFeatureFlagManager;
}

/**
 * Reset the global feature flag manager
 */
export function resetFeatureFlagManager(): void {
  globalFeatureFlagManager = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(name: string): boolean {
  return getFeatureFlagManager().isEnabled(name);
}

/**
 * Check if a feature is disabled
 */
export function isFeatureDisabled(name: string): boolean {
  return getFeatureFlagManager().isDisabled(name);
}

/**
 * Get a feature flag value
 */
export function getFeatureFlag<T extends FeatureFlagValue = boolean>(name: string): T | undefined {
  return getFeatureFlagManager().get<T>(name);
}

/**
 * Set a feature flag value
 */
export function setFeatureFlag(name: string, value: FeatureFlagValue, updatedBy?: string): void {
  getFeatureFlagManager().set(name, value, updatedBy);
}

/**
 * Register a feature flag
 */
export function registerFeatureFlag(
  name: string,
  defaultValue: FeatureFlagValue,
  options?: {
    description?: string;
    isCritical?: boolean;
    category?: string;
  }
): void {
  getFeatureFlagManager().register(name, defaultValue, options);
}

// ============================================================================
// Common Degradation Flags
// ============================================================================

/**
 * Standard degradation feature flags
 */
export const DegradationFlags = {
  // Service availability
  PAYMENTS_ENABLED: 'degradation.payments.enabled',
  NOTIFICATIONS_ENABLED: 'degradation.notifications.enabled',
  ANALYTICS_ENABLED: 'degradation.analytics.enabled',
  WEBHOOKS_ENABLED: 'degradation.webhooks.enabled',

  // Feature toggles
  REAL_TIME_UPDATES: 'degradation.realtime.enabled',
  DETAILED_LOGGING: 'degradation.logging.detailed',
  CACHE_ENABLED: 'degradation.cache.enabled',
  RATE_LIMITING_STRICT: 'degradation.ratelimit.strict',

  // Fallback modes
  USE_CACHED_DATA: 'degradation.fallback.cache',
  USE_DEFAULT_RESPONSE: 'degradation.fallback.default',
  SKIP_VALIDATION: 'degradation.validation.skip',

  // Load shedding
  REJECT_NEW_CONNECTIONS: 'degradation.loadshed.connections',
  REJECT_NON_CRITICAL: 'degradation.loadshed.noncritical',
  LIMIT_BATCH_SIZE: 'degradation.loadshed.batch',
} as const;

/**
 * Initialize standard degradation flags
 */
export function initDegradationFlags(manager?: FeatureFlagManager): void {
  const mgr = manager ?? getFeatureFlagManager();

  // Service availability - enabled by default
  mgr.register(DegradationFlags.PAYMENTS_ENABLED, true, {
    description: 'Enable payment processing',
    isCritical: true,
    category: 'service',
  });
  mgr.register(DegradationFlags.NOTIFICATIONS_ENABLED, true, {
    description: 'Enable notifications (email, push)',
    isCritical: false,
    category: 'service',
  });
  mgr.register(DegradationFlags.ANALYTICS_ENABLED, true, {
    description: 'Enable analytics tracking',
    isCritical: false,
    category: 'service',
  });
  mgr.register(DegradationFlags.WEBHOOKS_ENABLED, true, {
    description: 'Enable webhook delivery',
    isCritical: false,
    category: 'service',
  });

  // Feature toggles - enabled by default
  mgr.register(DegradationFlags.REAL_TIME_UPDATES, true, {
    description: 'Enable real-time WebSocket updates',
    isCritical: false,
    category: 'feature',
  });
  mgr.register(DegradationFlags.DETAILED_LOGGING, true, {
    description: 'Enable detailed logging',
    isCritical: false,
    category: 'feature',
  });
  mgr.register(DegradationFlags.CACHE_ENABLED, true, {
    description: 'Enable caching',
    isCritical: false,
    category: 'feature',
  });
  mgr.register(DegradationFlags.RATE_LIMITING_STRICT, false, {
    description: 'Enable strict rate limiting',
    isCritical: false,
    category: 'feature',
  });

  // Fallback modes - disabled by default
  mgr.register(DegradationFlags.USE_CACHED_DATA, false, {
    description: 'Use cached data when service unavailable',
    isCritical: false,
    category: 'fallback',
  });
  mgr.register(DegradationFlags.USE_DEFAULT_RESPONSE, false, {
    description: 'Return default response on error',
    isCritical: false,
    category: 'fallback',
  });
  mgr.register(DegradationFlags.SKIP_VALIDATION, false, {
    description: 'Skip non-critical validation',
    isCritical: false,
    category: 'fallback',
  });

  // Load shedding - disabled by default
  mgr.register(DegradationFlags.REJECT_NEW_CONNECTIONS, false, {
    description: 'Reject new connections under load',
    isCritical: false,
    category: 'loadshed',
  });
  mgr.register(DegradationFlags.REJECT_NON_CRITICAL, false, {
    description: 'Reject non-critical requests under load',
    isCritical: false,
    category: 'loadshed',
  });
  mgr.register(DegradationFlags.LIMIT_BATCH_SIZE, false, {
    description: 'Limit batch operation sizes',
    isCritical: false,
    category: 'loadshed',
  });
}
