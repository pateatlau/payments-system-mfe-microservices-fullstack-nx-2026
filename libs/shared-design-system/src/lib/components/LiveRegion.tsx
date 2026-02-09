import * as React from 'react';
import { cn } from '../utils/cn';

export interface LiveRegionProps {
  /** Content to announce to screen readers */
  children: React.ReactNode;
  /** Politeness level: 'polite' waits for pause, 'assertive' interrupts, 'off' disables */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether to announce the entire region on updates (true) or just changes (false) */
  atomic?: boolean;
  /** Which types of updates to announce */
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  /** Additional CSS classes */
  className?: string;
  /** Whether to visually hide the region (default: true) */
  visuallyHidden?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * ARIA live region component for dynamic content announcements.
 *
 * Live regions are used to announce dynamic content changes to screen readers.
 * When content inside a live region changes, screen readers will announce the change.
 *
 * @example
 * // Polite announcement (waits for pause in speech)
 * <LiveRegion>
 *   {isLoading ? 'Loading...' : 'Content loaded'}
 * </LiveRegion>
 *
 * @example
 * // Assertive announcement (interrupts current speech)
 * <LiveRegion politeness="assertive">
 *   {error && `Error: ${error.message}`}
 * </LiveRegion>
 *
 * @example
 * // Visible status message
 * <LiveRegion visuallyHidden={false} className="text-green-600">
 *   {successMessage}
 * </LiveRegion>
 */
export const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  (
    {
      children,
      politeness = 'polite',
      atomic = true,
      relevant = 'additions text',
      className,
      visuallyHidden = true,
      'data-testid': testId,
    },
    ref
  ) => {
    // Determine the appropriate role based on politeness
    const role = politeness === 'assertive' ? 'alert' : 'status';

    return (
      <div
        ref={ref}
        role={role}
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={cn(
          visuallyHidden && [
            'sr-only',
            // Fallback inline styles for environments without Tailwind
            'absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden',
            'clip-[rect(0,0,0,0)] whitespace-nowrap border-0',
          ],
          className
        )}
        data-testid={testId}
      >
        {children}
      </div>
    );
  }
);

LiveRegion.displayName = 'LiveRegion';
