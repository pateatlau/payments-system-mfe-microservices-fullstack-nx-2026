/**
 * Badge Component
 *
 * Small status indicators and labels
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-(--primary) bg-[rgb(var(--primary))] text-(--primary-foreground) text-[rgb(var(--primary-foreground))] hover:bg-(--primary)/80 hover:bg-[rgb(var(--primary))]/80',
        secondary:
          'border-2 border-(--border) border-[rgb(var(--border))] bg-(--secondary) bg-[rgb(var(--secondary))] text-(--secondary-foreground) text-[rgb(var(--secondary-foreground))] hover:bg-(--secondary) hover:bg-[rgb(var(--secondary))] hover:opacity-80 shadow-sm',
        destructive:
          'border-transparent bg-(--destructive) bg-[rgb(var(--destructive))] text-(--destructive-foreground) text-[rgb(var(--destructive-foreground))] hover:bg-(--destructive)/80 hover:bg-[rgb(var(--destructive))]/80',
        success:
          'border-transparent bg-green-600 text-white hover:bg-green-700',
        warning:
          'border-transparent bg-amber-600 text-white hover:bg-amber-700',
        outline:
          'text-(--foreground) text-[rgb(var(--foreground))] border-(--border) border-[rgb(var(--border))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
