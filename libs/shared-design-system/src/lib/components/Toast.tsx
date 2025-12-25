/**
 * Toast Component
 *
 * Display temporary notifications with different variants
 * Based on shadcn/ui patterns with Tailwind CSS v4
 *
 * Features:
 * - Auto-dismiss with configurable duration
 * - Multiple variants (success, error, warning, info)
 * - Accessible with ARIA attributes
 * - Smooth animations (slide in/out)
 * - Manual dismiss button
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const toastVariants = cva(
  'relative flex w-full max-w-md items-center justify-between gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
  {
    variants: {
      variant: {
        default:
          'bg-card border-border text-card-foreground shadow-md backdrop-blur-sm',
        success:
          'bg-emerald-50/80 border-emerald-500/100 text-foreground dark:bg-emerald-950/80 dark:text-foreground',
        error:
          'bg-destructive border-destructive text-destructive-foreground shadow-md',
        warning:
          'bg-amber-50/80 border-amber-500/100 text-foreground dark:bg-amber-950/80 dark:text-foreground',
        info: 'bg-blue-50/80 border-blue-500/100 text-foreground dark:bg-blue-950/80 dark:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /**
   * The message to display in the toast
   */
  message: string;
  /**
   * Optional title for the toast
   */
  title?: string;
  /**
   * Duration in milliseconds before auto-dismiss
   * @default 5000
   */
  duration?: number;
  /**
   * Callback when the toast is dismissed
   */
  onDismiss?: () => void;
  /**
   * Whether to show the close button
   * @default true
   */
  showClose?: boolean;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant,
      message,
      title,
      duration = 5000,
      onDismiss,
      showClose = true,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onDismiss?.();
          }, 300); // Wait for animation to complete
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss?.();
      }, 300); // Wait for animation to complete
    };

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          toastVariants({ variant }),
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none',
          className
        )}
        {...props}
      >
        <div className="flex-1 space-y-1">
          {title && (
            <div className="text-sm font-semibold leading-none">{title}</div>
          )}
          <div className="text-sm leading-relaxed">{message}</div>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 hover:bg-(--muted) transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = 'Toast';

/**
 * ToastContainer Component
 *
 * Container for displaying multiple toasts with positioning
 */
export interface ToastContainerProps {
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /**
   * Child toast elements
   */
  children: React.ReactNode;
}

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  children,
}) => {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      {children}
    </div>
  );
};

export { Toast, ToastContainer, toastVariants };
