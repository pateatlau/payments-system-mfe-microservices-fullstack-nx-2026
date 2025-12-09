import { ReactNode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Button,
} from '@mfe/shared-design-system';

/**
 * Props for RemoteErrorBoundary
 */
export interface RemoteErrorBoundaryProps {
  /**
   * The component to wrap with error boundary
   */
  children: ReactNode;

  /**
   * Name of the remote component (for error message)
   */
  componentName: string;

  /**
   * Optional custom fallback component
   */
  fallback?: ReactNode;
}

/**
 * Default error fallback component
 * Uses design system Card, Alert, and Button components
 */
function DefaultErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle>Failed to Load Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            We couldn't load the component from the remote. This might be a
            temporary issue.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-words">
                    {error.message}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={resetErrorBoundary}>Try Again</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * RemoteErrorBoundary component
 *
 * Wraps remote components with error boundary to catch loading errors.
 * Provides user-friendly error UI with retry and navigation options.
 *
 * @example
 * <RemoteErrorBoundary componentName="SignIn">
 *   <SignInComponent />
 * </RemoteErrorBoundary>
 */
export function RemoteErrorBoundary({
  children,
  componentName,
  fallback,
}: RemoteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={
        fallback ? () => <>{fallback}</> : DefaultErrorFallback
      }
      onError={(error, errorInfo) => {
        // Log error for debugging
        // eslint-disable-next-line no-console
        console.error(
          `Failed to load ${componentName} component:`,
          error,
          errorInfo
        );
      }}
      onReset={() => {
        // Clear any cached errors
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
