/**
 * Select Component
 *
 * A styled select dropdown component with proper theming
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { cn } from '../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
          'border-[rgb(var(--input))]',
          'bg-[rgb(var(--background))]',
          'text-[rgb(var(--foreground))]',
          'ring-offset-[rgb(var(--background))]',
          'placeholder:text-[rgb(var(--muted-foreground))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>option]:bg-[rgb(var(--background))]',
          '[&>option]:text-[rgb(var(--foreground))]',
          // Custom arrow styling
          'appearance-none bg-no-repeat',
          'bg-[length:16px_16px] bg-[right_0.75rem_center]',
          'pr-10', // Extra padding for custom arrow
          // SVG arrow that adapts to theme
          "dark:bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23f9fafb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]",
          "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
