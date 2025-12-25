/**
 * Alert Component
 *
 * Display important messages with different severity levels
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const alertVariants = cva('relative w-full rounded-lg border p-4', {
  variants: {
    variant: {
      default:
        'bg-(--background) bg-[rgb(var(--background))] border-(--border) border-[rgb(var(--border))] text-(--foreground) text-[rgb(var(--foreground))]',
      destructive:
        'bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20 dark:border-destructive/50 dark:text-destructive',
      success:
        'bg-emerald-500/15 border-emerald-500/40 text-foreground dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-foreground',
      warning:
        'bg-amber-500/15 border-amber-500/40 text-foreground dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-foreground',
      info: 'bg-blue-500/15 border-blue-500/40 text-foreground dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
