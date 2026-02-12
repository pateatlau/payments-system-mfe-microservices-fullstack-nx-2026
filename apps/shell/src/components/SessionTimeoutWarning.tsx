/**
 * Session Timeout Warning Component
 *
 * POC-3 Phase 7.4: Displays a modal warning when the session is about to expire.
 *
 * Features:
 * - Countdown timer showing time remaining
 * - "Stay Signed In" button to extend session
 * - "Sign Out" button for manual logout
 * - Accessible modal with focus trap
 * - Auto-extends session if user clicks anywhere or presses a key
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { formatTimeRemaining } from '@mfe/shared-utils';

interface SessionTimeoutWarningProps {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Called when user wants to extend session */
  onExtend: () => void;
  /** Whether the warning is visible */
  isVisible: boolean;
}

export function SessionTimeoutWarning({
  timeRemaining,
  onExtend,
  isVisible,
}: SessionTimeoutWarningProps) {
  const logout = useAuthStore(state => state.logout);
  const modalRef = useRef<HTMLDivElement>(null);
  const extendButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the extend button when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        extendButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle keyboard events
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onExtend();
        return;
      }

      // Trap focus within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onExtend]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const formatted = formatTimeRemaining(timeRemaining);
  const isUrgent = timeRemaining <= 30000; // 30 seconds

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
        aria-hidden="true"
        onClick={onExtend}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md rounded-lg bg-background border border-border shadow-xl p-6 animate-in zoom-in-95 duration-200"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isUrgent
                ? 'bg-destructive/10 text-destructive'
                : 'bg-warning/10 text-warning'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="session-timeout-title"
          className="text-lg font-semibold text-center text-foreground mb-2"
        >
          Session Expiring Soon
        </h2>

        {/* Description */}
        <p
          id="session-timeout-description"
          className="text-center text-muted-foreground mb-4"
        >
          For your security, your session will expire due to inactivity.
        </p>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div
            className={`text-3xl font-mono font-bold tabular-nums ${
              isUrgent ? 'text-destructive' : 'text-foreground'
            }`}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatted}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            ref={extendButtonRef}
            onClick={onExtend}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            Stay Signed In
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Click anywhere or press any key to stay signed in.
        </p>
      </div>
    </>
  );
}

export default SessionTimeoutWarning;
