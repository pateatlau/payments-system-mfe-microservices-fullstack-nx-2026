import { ReactNode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

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
 */
function DefaultErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Failed to Load Component
        </h2>
        <p className="text-slate-600 mb-4">
          We couldn't load the component from the remote. This might be a temporary issue.
        </p>
        {error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
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
      FallbackComponent={fallback ? () => <>{fallback}</> : DefaultErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error(`Failed to load ${componentName} component:`, error, errorInfo);
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

