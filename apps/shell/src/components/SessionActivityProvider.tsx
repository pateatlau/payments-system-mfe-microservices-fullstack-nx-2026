/**
 * Session Activity Provider
 *
 * POC-3 Phase 7.4: Provides session activity monitoring for the entire app.
 *
 * Features:
 * - Tracks user activity and displays timeout warnings
 * - Automatically logs out on session timeout
 * - Syncs activity across browser tabs
 * - Configurable timeout and warning periods
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { eventBus } from '@mfe/shared-event-bus';
import {
  useSessionActivity,
  SESSION_TIMEOUT_PRESETS,
  SESSION_WARNING_PRESETS,
  clearSessionFingerprint,
} from '@mfe/shared-utils';
import { clearCachedFingerprint } from '@mfe/shared-api-client';
import SessionTimeoutWarning from './SessionTimeoutWarning';

/**
 * Session timeout configuration
 * Can be customized via environment variables
 */
const SESSION_CONFIG = {
  // Use environment variable or default to 15 minutes
  idleTimeout:
    parseInt(process.env['NX_SESSION_TIMEOUT_MS'] || '', 10) ||
    SESSION_TIMEOUT_PRESETS.standard,
  // Warning 2 minutes before timeout
  warningTime: SESSION_WARNING_PRESETS.standard,
  // Update activity at most every 30 seconds (reduces storage writes)
  activityThrottle: 30 * 1000,
};

interface SessionActivityProviderProps {
  children: React.ReactNode;
}

export function SessionActivityProvider({
  children,
}: SessionActivityProviderProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    console.warn('[SessionActivity] Session timed out due to inactivity');

    // Emit session expired event
    if (user?.id) {
      eventBus.emit(
        'auth:session-expired',
        {
          userId: user.id,
          reason: 'inactivity_timeout',
        },
        'shell'
      );
    }

    // Clear fingerprint caches
    clearSessionFingerprint();
    clearCachedFingerprint();

    // Perform logout
    await logout();
  }, [logout, user?.id]);

  // Handle warning shown
  const handleWarning = useCallback((timeRemaining: number) => {
    console.log(
      `[SessionActivity] Warning: Session will expire in ${Math.ceil(timeRemaining / 1000)} seconds`
    );
  }, []);

  // Handle warning dismissed
  const handleWarningDismissed = useCallback(() => {
    console.log('[SessionActivity] Session extended by user activity');
  }, []);

  // Use session activity hook
  const {
    state,
    showWarning,
    extend,
    stop,
  } = useSessionActivity({
    enabled: isAuthenticated,
    config: SESSION_CONFIG,
    onWarning: handleWarning,
    onWarningDismissed: handleWarningDismissed,
    onTimeout: handleTimeout,
  });

  // Stop monitoring when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      stop();
    }
  }, [isAuthenticated, stop]);

  // Refs for dev logging to avoid recreating interval
  const sessionStateRef = useRef(state);
  const showWarningRef = useRef(showWarning);

  // Keep refs updated
  useEffect(() => {
    sessionStateRef.current = state;
    showWarningRef.current = showWarning;
  }, [state, showWarning]);

  // Log session state changes (debug) - uses refs to avoid interval recreation
  useEffect(() => {
    if (process.env['NODE_ENV'] === 'development' && isAuthenticated) {
      const logInterval = setInterval(() => {
        const currentState = sessionStateRef.current;
        const currentShowWarning = showWarningRef.current;
        if (currentState.isActive && !currentShowWarning) {
          const minutes = Math.floor(currentState.timeRemaining / 60000);
          const seconds = Math.floor((currentState.timeRemaining % 60000) / 1000);
          console.debug(
            `[SessionActivity] Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }, 60000); // Log every minute in dev

      return () => clearInterval(logInterval);
    }
  }, [isAuthenticated]); // Only depends on isAuthenticated, reads latest state from refs

  return (
    <>
      {children}
      <SessionTimeoutWarning
        timeRemaining={state.timeRemaining}
        onExtend={extend}
        isVisible={showWarning}
      />
    </>
  );
}

export default SessionActivityProvider;
