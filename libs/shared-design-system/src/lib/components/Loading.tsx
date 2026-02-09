/**
 * Loading Component
 *
 * An accessible spinner component for loading states.
 * Based on shadcn/ui patterns with Tailwind CSS v4.
 *
 * Accessibility features:
 * - role="status" for screen reader announcements
 * - aria-busy="true" to indicate loading state
 * - aria-live="polite" for non-disruptive announcements
 * - Optional screen reader announcements via useAnnounce hook
 *
 * @example
 * // Basic usage
 * <Loading />
 *
 * // With custom message
 * <Loading label="Loading payments..." />
 *
 * // Different sizes
 * <Loading size="lg" label="Processing..." showLabel />
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { useAnnounce } from '@mfe/shared-utils';

const loadingVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-8 w-8',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface LoadingProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  /** Message for screen readers and optional visual display */
  label?: string;
  /** Whether to show the label text visually (default: true if label provided) */
  showLabel?: boolean;
  /** Whether to announce to screen readers when loading starts (default: true) */
  announceOnMount?: boolean;
}

function Loading({
  className,
  size,
  label = 'Loading...',
  showLabel,
  announceOnMount = true,
  ...props
}: LoadingProps) {
  const announce = useAnnounce();

  // Announce loading state to screen readers
  React.useEffect(() => {
    if (announceOnMount) {
      announce(label, { politeness: 'polite', clearAfter: 0 });
    }
  }, [announce, announceOnMount, label]);

  // Determine if we should show the label visually
  const displayLabel = showLabel ?? (label !== 'Loading...');

  return (
    <div
      className={cn('flex flex-col items-center gap-2', props.className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      {...props}
    >
      <div
        className={cn(loadingVariants({ size }), className)}
        aria-hidden="true"
      >
        <span className="sr-only">{label}</span>
      </div>
      {displayLabel && (
        <p className="text-sm text-muted-foreground" aria-hidden="true">
          {label}
        </p>
      )}
    </div>
  );
}

export { Loading, loadingVariants };
