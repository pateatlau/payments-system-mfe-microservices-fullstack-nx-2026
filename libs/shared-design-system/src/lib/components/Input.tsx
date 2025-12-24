/**
 * Input Component
 *
 * A styled input component for forms
 * Based on shadcn/ui patterns with Tailwind CSS v4
 */

import * as React from 'react';
import { cn } from '../utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground)',
          'placeholder:text-(--muted-foreground)',
          'focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
