/**
 * useSessionActivity Hook
 *
 * POC-3 Phase 7.4: React hook for session activity monitoring.
 *
 * Provides:
 * - Automatic activity tracking
 * - Session timeout warnings
 * - Session extension on activity
 * - Cross-tab synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SessionActivityMonitor,
  SessionActivityConfig,
  SessionActivityState,
  formatTimeRemaining,
  SESSION_TIMEOUT_PRESETS,
  SESSION_WARNING_PRESETS,
} from '../session-activity';

/**
 * Hook options
 */
export interface UseSessionActivityOptions {
  /** Enable activity monitoring (default: true when authenticated) */
  enabled?: boolean;
  /** Session timeout configuration */
  config?: Partial<SessionActivityConfig>;
  /** Callback when session is about to expire */
  onWarning?: (timeRemaining: number) => void;
  /** Callback when warning is dismissed */
  onWarningDismissed?: () => void;
  /** Callback when session times out */
  onTimeout?: () => void;
  /** Callback when activity is detected */
  onActivity?: () => void;
  /** Callback when session is extended */
  onExtend?: () => void;
}

/**
 * Hook return value
 */
export interface UseSessionActivityReturn {
  /** Current session activity state */
  state: SessionActivityState;
  /** Formatted time remaining (e.g., "2:30") */
  formattedTimeRemaining: string;
  /** Whether warning modal should be shown */
  showWarning: boolean;
  /** Extend the session (reset timeout) */
  extend: () => void;
  /** Start monitoring (useful after login) */
  start: () => void;
  /** Stop monitoring (useful for logout) */
  stop: () => void;
  /** Dismiss the warning (extends session) */
  dismissWarning: () => void;
}

/**
 * Default state when not monitoring
 */
const DEFAULT_STATE: SessionActivityState = {
  lastActivity: 0,
  isActive: false,
  isWarningShown: false,
  timeRemaining: 0,
  isTimedOut: false,
};

/**
 * Hook for session activity monitoring
 */
export function useSessionActivity(
  options: UseSessionActivityOptions = {}
): UseSessionActivityReturn {
  const {
    enabled = true,
    config,
    onWarning,
    onWarningDismissed,
    onTimeout,
    onActivity,
    onExtend,
  } = options;

  const [state, setState] = useState<SessionActivityState>(DEFAULT_STATE);
  const [showWarning, setShowWarning] = useState(false);
  const monitorRef = useRef<SessionActivityMonitor | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store callbacks in refs to avoid effect recreation when inline functions change
  const onWarningRef = useRef(onWarning);
  const onWarningDismissedRef = useRef(onWarningDismissed);
  const onTimeoutRef = useRef(onTimeout);
  const onActivityRef = useRef(onActivity);
  const onExtendRef = useRef(onExtend);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onWarningRef.current = onWarning;
    onWarningDismissedRef.current = onWarningDismissed;
    onTimeoutRef.current = onTimeout;
    onActivityRef.current = onActivity;
    onExtendRef.current = onExtend;
  }, [onWarning, onWarningDismissed, onTimeout, onActivity, onExtend]);

  // Create monitor instance - only depends on enabled and config
  // Callbacks are accessed via refs to avoid recreation
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const monitor = new SessionActivityMonitor(config, {
      onWarning: timeRemaining => {
        setShowWarning(true);
        onWarningRef.current?.(timeRemaining);
      },
      onWarningDismissed: () => {
        setShowWarning(false);
        onWarningDismissedRef.current?.();
      },
      onTimeout: () => {
        setShowWarning(false);
        onTimeoutRef.current?.();
      },
      onActivity: () => onActivityRef.current?.(),
      onExtend: () => onExtendRef.current?.(),
    });

    monitorRef.current = monitor;
    monitor.start();

    // Update state periodically
    updateIntervalRef.current = setInterval(() => {
      if (monitorRef.current) {
        setState(monitorRef.current.getState());
      }
    }, 1000);

    // Initial state
    setState(monitor.getState());

    return () => {
      monitor.stop();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      monitorRef.current = null;
    };
    // Note: config is intentionally excluded from deps - it's only read at initialization.
    // To update config after mount, use monitor.updateConfig() via the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Extend session
  const extend = useCallback(() => {
    monitorRef.current?.extend();
    setShowWarning(false);
  }, []);

  // Start monitoring
  const start = useCallback(() => {
    monitorRef.current?.start();
  }, []);

  // Stop monitoring
  const stop = useCallback(() => {
    monitorRef.current?.stop();
    setShowWarning(false);
    setState(DEFAULT_STATE);
  }, []);

  // Dismiss warning (same as extend)
  const dismissWarning = useCallback(() => {
    extend();
  }, [extend]);

  // Format time remaining
  const formattedTimeRemaining = formatTimeRemaining(state.timeRemaining);

  return {
    state,
    formattedTimeRemaining,
    showWarning,
    extend,
    start,
    stop,
    dismissWarning,
  };
}

// Re-export presets for convenience
export { SESSION_TIMEOUT_PRESETS, SESSION_WARNING_PRESETS };
