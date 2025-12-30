/**
 * Select Component
 *
 * A styled select dropdown component with proper theming
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { cn } from '../utils/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          className={cn(
            className,
            'flex h-10 w-full items-center justify-between rounded-md border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground)',
            'placeholder:text-(--muted-foreground)',
            'focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>option]:bg-(--background)',
            '[&>option]:text-(--foreground)',
            'appearance-none',
            'pr-10' // Extra padding for custom arrow
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Chevron down icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-(--foreground)">
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
