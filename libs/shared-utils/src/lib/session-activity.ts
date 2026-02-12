/**
 * Session Activity Monitor
 *
 * POC-3 Phase 7.4: Tracks user activity to detect idle sessions and
 * provide session timeout warnings.
 *
 * Features:
 * - Tracks last activity timestamp
 * - Configurable idle timeout
 * - Warning callback before session expires
 * - Session extension on user activity
 * - Cross-tab activity sync via BroadcastChannel
 *
 * Events tracked as "activity":
 * - Mouse movements
 * - Keyboard input
 * - Touch events
 * - Scroll events
 * - Click events
 */

/**
 * Session activity configuration
 */
export interface SessionActivityConfig {
  /** Idle timeout in milliseconds (default: 15 minutes) */
  idleTimeout: number;
  /** Warning time before timeout in milliseconds (default: 2 minutes) */
  warningTime: number;
  /** Throttle activity updates in milliseconds (default: 30 seconds) */
  activityThrottle: number;
  /** Enable cross-tab sync (default: true) */
  enableCrossTabSync: boolean;
  /** Channel name for cross-tab sync (default: 'session-activity') */
  channelName: string;
  /** Storage key for last activity (default: 'mfe-last-activity') */
  storageKey: string;
  /** Events to track as activity */
  activityEvents: string[];
}

/**
 * Session activity state
 */
export interface SessionActivityState {
  /** Last activity timestamp */
  lastActivity: number;
  /** Whether session is active */
  isActive: boolean;
  /** Whether warning is showing */
  isWarningShown: boolean;
  /** Time remaining until timeout (ms) */
  timeRemaining: number;
  /** Whether session has timed out */
  isTimedOut: boolean;
}

/**
 * Session activity callbacks
 */
export interface SessionActivityCallbacks {
  /** Called when session is about to expire */
  onWarning?: (timeRemaining: number) => void;
  /** Called when warning is dismissed (activity detected) */
  onWarningDismissed?: () => void;
  /** Called when session times out */
  onTimeout?: () => void;
  /** Called when activity is detected */
  onActivity?: () => void;
  /** Called when session is extended */
  onExtend?: () => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SessionActivityConfig = {
  idleTimeout: 15 * 60 * 1000, // 15 minutes
  warningTime: 2 * 60 * 1000, // 2 minutes before timeout
  activityThrottle: 30 * 1000, // Update activity at most every 30 seconds
  enableCrossTabSync: true,
  channelName: 'session-activity',
  storageKey: 'mfe-last-activity',
  activityEvents: [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
  ],
};

/**
 * Session Activity Monitor class
 */
export class SessionActivityMonitor {
  private config: SessionActivityConfig;
  private callbacks: SessionActivityCallbacks;
  private lastActivity: number = 0;
  private lastActivityUpdate: number = 0;
  private isRunning: boolean = false;
  private isWarningShown: boolean = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private channel: BroadcastChannel | null = null;
  private boundActivityHandler: () => void;
  private boundVisibilityHandler: () => void;
  /** Flag to prevent timeout broadcast storm when receiving TIMEOUT from remote */
  private timeoutFromRemote: boolean = false;

  constructor(
    config: Partial<SessionActivityConfig> = {},
    callbacks: SessionActivityCallbacks = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
    this.boundActivityHandler = this.handleActivity.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
  }

  /**
   * Start monitoring session activity
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastActivity = this.loadLastActivity();
    this.lastActivityUpdate = Date.now();

    // Add activity event listeners
    if (typeof window !== 'undefined') {
      this.config.activityEvents.forEach(event => {
        window.addEventListener(event, this.boundActivityHandler, {
          passive: true,
        });
      });

      // Handle visibility change (tab becomes visible)
      document.addEventListener(
        'visibilitychange',
        this.boundVisibilityHandler
      );
    }

    // Initialize cross-tab sync
    if (this.config.enableCrossTabSync) {
      this.initCrossTabSync();
    }

    // Start checking for timeout
    this.startChecking();

    // Log activity immediately
    this.recordActivity();
  }

  /**
   * Stop monitoring session activity
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.isWarningShown = false;

    // Remove activity event listeners
    if (typeof window !== 'undefined') {
      this.config.activityEvents.forEach(event => {
        window.removeEventListener(event, this.boundActivityHandler);
      });
      document.removeEventListener(
        'visibilitychange',
        this.boundVisibilityHandler
      );
    }

    // Stop checking
    this.stopChecking();

    // Close cross-tab channel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  /**
   * Manually extend the session (reset timeout)
   */
  extend(): void {
    this.recordActivity();
    this.callbacks.onExtend?.();

    // Dismiss warning if shown
    if (this.isWarningShown) {
      this.isWarningShown = false;
      this.callbacks.onWarningDismissed?.();
    }
  }

  /**
   * Get current activity state
   */
  getState(): SessionActivityState {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeRemaining = Math.max(
      0,
      this.config.idleTimeout - timeSinceActivity
    );
    const isTimedOut = timeRemaining === 0;
    const isActive = this.isRunning && !isTimedOut;

    return {
      lastActivity: this.lastActivity,
      isActive,
      isWarningShown: this.isWarningShown,
      timeRemaining,
      isTimedOut,
    };
  }

  /**
   * Update configuration
   *
   * Structural changes (activityEvents, enableCrossTabSync, channelName, storageKey)
   * require a restart to take effect. Numeric changes (idleTimeout, warningTime,
   * activityThrottle) apply immediately.
   */
  updateConfig(config: Partial<SessionActivityConfig>): void {
    const oldConfig = this.config;

    // Check if any structural keys changed that require restart
    const structuralKeys: (keyof SessionActivityConfig)[] = [
      'activityEvents',
      'enableCrossTabSync',
      'channelName',
      'storageKey',
    ];

    const needsRestart = structuralKeys.some(key => {
      if (config[key] === undefined) return false;
      if (key === 'activityEvents') {
        // Compare arrays
        const oldEvents = oldConfig.activityEvents;
        const newEvents = config.activityEvents;
        if (!newEvents) return false;
        if (oldEvents.length !== newEvents.length) return true;
        return oldEvents.some((e, i) => e !== newEvents[i]);
      }
      return oldConfig[key] !== config[key];
    });

    // Update config
    this.config = { ...this.config, ...config };

    // If structural changes and currently running, restart to apply changes
    if (needsRestart && this.isRunning) {
      this.stop();
      this.start();
    } else if (this.isRunning) {
      // For numeric-only changes, restart the checking interval to use new thresholds
      this.stopChecking();
      this.startChecking();
    }
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: SessionActivityCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Handle user activity event
   */
  private handleActivity(): void {
    const now = Date.now();

    // Throttle activity updates
    if (now - this.lastActivityUpdate < this.config.activityThrottle) {
      return;
    }

    this.recordActivity();

    // Dismiss warning if shown
    if (this.isWarningShown) {
      this.isWarningShown = false;
      this.callbacks.onWarningDismissed?.();
    }
  }

  /**
   * Handle visibility change (tab focus)
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Tab became visible - check if session is still valid
      const storedActivity = this.loadLastActivity();
      if (storedActivity > this.lastActivity) {
        // Another tab had more recent activity
        this.lastActivity = storedActivity;
      }

      // Record activity if user returns to tab
      this.recordActivity();
    }
  }

  /**
   * Record activity timestamp
   */
  private recordActivity(): void {
    const now = Date.now();
    this.lastActivity = now;
    this.lastActivityUpdate = now;

    // Save to localStorage
    this.saveLastActivity(now);

    // Broadcast to other tabs
    if (this.channel) {
      this.channel.postMessage({ type: 'ACTIVITY', timestamp: now });
    }

    this.callbacks.onActivity?.();
  }

  /**
   * Initialize cross-tab sync
   */
  private initCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    try {
      this.channel = new BroadcastChannel(this.config.channelName);
      this.channel.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          type: string;
          timestamp?: number;
        };

        if (data.type === 'ACTIVITY' && data.timestamp) {
          // Update last activity from other tab
          if (data.timestamp > this.lastActivity) {
            this.lastActivity = data.timestamp;
            this.saveLastActivity(data.timestamp);

            // Dismiss warning if activity from another tab
            if (this.isWarningShown) {
              this.isWarningShown = false;
              this.callbacks.onWarningDismissed?.();
            }
          }
        } else if (data.type === 'TIMEOUT') {
          // Another tab timed out - trigger timeout here too
          // Set flag to prevent re-broadcasting (avoids message storm)
          this.timeoutFromRemote = true;
          this.handleTimeout();
        }
      };
    } catch (error) {
      console.warn(
        '[SessionActivityMonitor] Failed to initialize BroadcastChannel',
        error
      );
    }
  }

  /**
   * Start the timeout checking interval
   */
  private startChecking(): void {
    if (this.checkInterval) {
      return;
    }

    // Check every second for precise timeout detection
    this.checkInterval = setInterval(() => {
      this.checkTimeout();
    }, 1000);
  }

  /**
   * Stop the timeout checking interval
   */
  private stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if session has timed out
   */
  private checkTimeout(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeRemaining = this.config.idleTimeout - timeSinceActivity;

    // Check if we should show warning
    if (!this.isWarningShown && timeRemaining <= this.config.warningTime) {
      this.isWarningShown = true;
      this.callbacks.onWarning?.(timeRemaining);
    }

    // Check if session has timed out
    if (timeRemaining <= 0) {
      this.handleTimeout();
    }
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    // Only broadcast if this is the originating tab (not received from remote)
    // This prevents a broadcast storm where tabs keep notifying each other
    if (this.channel && !this.timeoutFromRemote) {
      this.channel.postMessage({ type: 'TIMEOUT' });
    }

    // Clear the flag after processing
    this.timeoutFromRemote = false;

    this.callbacks.onTimeout?.();
    this.stop();
  }

  /**
   * Load last activity from localStorage
   */
  private loadLastActivity(): number {
    if (typeof localStorage === 'undefined') {
      return Date.now();
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (!isNaN(timestamp) && timestamp > 0) {
          return timestamp;
        }
      }
    } catch {
      // Ignore storage errors
    }

    return Date.now();
  }

  /**
   * Save last activity to localStorage
   */
  private saveLastActivity(timestamp: number): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.config.storageKey, timestamp.toString());
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Create a session activity monitor with default configuration
 */
export function createSessionActivityMonitor(
  config?: Partial<SessionActivityConfig>,
  callbacks?: SessionActivityCallbacks
): SessionActivityMonitor {
  return new SessionActivityMonitor(config, callbacks);
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return 'Session expired';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Use singular form for "1 second"
  if (remainingSeconds === 1) {
    return '1 second';
  }

  return `${remainingSeconds} seconds`;
}

/**
 * Default timeout presets (in milliseconds)
 */
export const SESSION_TIMEOUT_PRESETS = {
  /** 5 minutes - Very strict, for highly sensitive applications */
  strict: 5 * 60 * 1000,
  /** 15 minutes - Standard timeout for financial applications */
  standard: 15 * 60 * 1000,
  /** 30 minutes - Relaxed timeout for general applications */
  relaxed: 30 * 60 * 1000,
  /** 60 minutes - Extended timeout for low-risk applications */
  extended: 60 * 60 * 1000,
} as const;

/**
 * Default warning time presets (in milliseconds)
 */
export const SESSION_WARNING_PRESETS = {
  /** 30 seconds before timeout */
  short: 30 * 1000,
  /** 1 minute before timeout */
  minute: 60 * 1000,
  /** 2 minutes before timeout */
  standard: 2 * 60 * 1000,
  /** 5 minutes before timeout */
  long: 5 * 60 * 1000,
} as const;
