/**
 * Button Component
 *
 * A versatile, accessible button component with multiple variants and sizes.
 * Based on shadcn/ui patterns with Tailwind CSS v4.
 *
 * Accessibility features:
 * - Proper disabled state handling
 * - Loading state with aria-busy and spinner
 * - Screen reader announcements for loading state
 *
 * @example
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // Loading state
 * <Button loading loadingText="Saving...">Save</Button>
 *
 * // Disabled
 * <Button disabled>Cannot click</Button>
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-(--primary) bg-[rgb(var(--primary))] text-(--primary-foreground) text-[rgb(var(--primary-foreground))] hover:bg-(--primary)/90 hover:bg-[rgb(var(--primary))]/90',
        destructive:
          'bg-(--destructive) bg-[rgb(var(--destructive))] text-(--destructive-foreground) text-[rgb(var(--destructive-foreground))] hover:bg-(--destructive)/90 hover:bg-[rgb(var(--destructive))]/90',
        outline:
          'border border-(--border) border-[rgb(var(--border))] bg-(--background) bg-[rgb(var(--background))] hover:bg-(--muted) hover:bg-[rgb(var(--muted))]',
        secondary:
          'bg-(--muted) bg-[rgb(var(--muted))] text-(--muted-foreground) text-[rgb(var(--muted-foreground))] hover:bg-(--muted)/80 hover:bg-[rgb(var(--muted))]/80',
        ghost: 'hover:bg-(--muted) hover:bg-[rgb(var(--muted))]',
        link: 'text-(--primary) text-[rgb(var(--primary))] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Loading spinner component for buttons
 */
function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a loading spinner and disables the button */
  loading?: boolean;
  /** Text to show during loading (replaces children) */
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    loading = false,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading && <ButtonSpinner />}
        {loading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
