/**
 * Skeleton Component
 *
 * Placeholder loading state for content
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { cn } from '../utils/cn';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  );
}

export { Skeleton };
