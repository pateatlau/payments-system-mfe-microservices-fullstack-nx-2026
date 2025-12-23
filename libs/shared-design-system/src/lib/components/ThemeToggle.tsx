/**
 * ThemeToggle Component
 *
 * A button component that cycles through theme options: light → dark → system
 * Displays appropriate icon based on current theme state
 */

import * as React from 'react';
import { useTheme } from '@mfe/shared-theme-store';
import { cn } from '../utils/cn';

export interface ThemeToggleProps {
  /**
   * Visual variant of the toggle
   * - button: Icon button style (default)
   * - dropdown: Dropdown menu style (future enhancement)
   */
  variant?: 'button' | 'dropdown';

  /**
   * Whether to show label text alongside icon
   */
  showLabel?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ThemeToggle component
 *
 * Allows users to cycle through theme preferences:
 * - Light mode (sun icon)
 * - Dark mode (moon icon)
 * - System preference (monitor icon)
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle showLabel />
 * ```
 */
export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  ThemeToggleProps
>(({ variant = 'button', showLabel = false, className }, ref) => {
  const { theme, setTheme } = useTheme();

  const handleToggle = async () => {
    // Cycle: light → dark → system → light
    const nextTheme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    await setTheme(nextTheme);
  };

  // Get icon and label based on current theme
  const getThemeDisplay = () => {
    switch (theme) {
      case 'light':
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ),
          label: 'Light',
          ariaLabel: 'Switch to dark mode',
        };
      case 'dark':
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ),
          label: 'Dark',
          ariaLabel: 'Switch to system preference',
        };
      case 'system':
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ),
          label: 'System',
          ariaLabel: 'Switch to light mode',
        };
    }
  };

  const display = getThemeDisplay();

  if (variant === 'dropdown') {
    // Future enhancement: dropdown menu with all three options
    // For now, fall back to button variant
    console.warn(
      'ThemeToggle: dropdown variant not yet implemented, using button'
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-md p-2',
        'text-sm font-medium',
        'transition-colors',
        'hover:bg-[rgb(var(--muted))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'dark:hover:bg-[rgb(var(--muted))]',
        className
      )}
      aria-label={display.ariaLabel}
      title={display.ariaLabel}
    >
      {display.icon}
      {showLabel && <span>{display.label}</span>}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
