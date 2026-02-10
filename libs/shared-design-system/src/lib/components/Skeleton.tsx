/**
 * Skeleton Component
 *
 * An accessible placeholder loading state for content.
 * Based on shadcn/ui patterns with Tailwind CSS v4.
 *
 * Accessibility features:
 * - role="status" for screen reader announcements
 * - aria-busy="true" to indicate loading state
 * - aria-label for describing what is loading
 *
 * @example
 * // Basic usage
 * <Skeleton className="h-4 w-[200px]" />
 *
 * // With custom label for screen readers
 * <Skeleton label="Loading user avatar" className="h-12 w-12 rounded-full" />
 *
 * // Card skeleton
 * <div className="space-y-2">
 *   <Skeleton label="Loading title" className="h-4 w-[250px]" />
 *   <Skeleton label="Loading description" className="h-4 w-[200px]" />
 * </div>
 */

import * as React from 'react';
import { cn } from '../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible label describing what content is loading */
  label?: string;
}

function Skeleton({
  className,
  label = 'Loading content',
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
