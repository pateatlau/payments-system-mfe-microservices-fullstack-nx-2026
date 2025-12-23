/**
 * Shared Design System Library
 *
 * Production-ready component library based on shadcn/ui patterns
 * with Tailwind CSS v4
 *
 * Features:
 * - Type-safe component props
 * - Accessible components (ARIA)
 * - Consistent design tokens
 * - Flexible variants with CVA
 * - Tailwind CSS v4 styling
 */

// Utilities
export { cn } from './lib/utils/cn';

// Design Tokens
export * from './lib/tokens';

// Components
export { Button, buttonVariants } from './lib/components/Button';
export type { ButtonProps } from './lib/components/Button';

export { Input } from './lib/components/Input';
export type { InputProps } from './lib/components/Input';

export { Select } from './lib/components/Select';
export type { SelectProps } from './lib/components/Select';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './lib/components/Card';

export { Alert, AlertTitle, AlertDescription } from './lib/components/Alert';

export { Label } from './lib/components/Label';
export type { LabelProps } from './lib/components/Label';

export { Badge, badgeVariants } from './lib/components/Badge';
export type { BadgeProps } from './lib/components/Badge';

export {
  StatusBadge,
  getStatusInfo,
  renderStatusIcon,
} from './lib/components/StatusBadge';
export type {
  StatusBadgeProps,
  StatusIcon,
  StatusInfo,
} from './lib/components/StatusBadge';

export { Loading, loadingVariants } from './lib/components/Loading';
export type { LoadingProps } from './lib/components/Loading';

export { Skeleton } from './lib/components/Skeleton';

export { Toast, ToastContainer, toastVariants } from './lib/components/Toast';
export type { ToastProps, ToastContainerProps } from './lib/components/Toast';

export { ThemeToggle } from './lib/components/ThemeToggle';
export type { ThemeToggleProps } from './lib/components/ThemeToggle';
