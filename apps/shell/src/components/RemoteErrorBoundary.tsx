import { ReactNode, useState, useEffect, useCallback, useRef, ErrorInfo } from 'react';
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
import {
  remoteCircuitBreaker,
  CircuitState,
  calculateBackoffDelay,
} from '@mfe/shared-utils';
import { captureException, addBreadcrumb, setTag } from '@mfe-poc/shared-observability';

/**
 * Maximum number of automatic retries before showing error UI
 */
const MAX_AUTO_RETRIES = 2;

/**
 * Delay before first automatic retry (ms)
 */
const INITIAL_RETRY_DELAY = 1000;

/**
 * Props for RemoteErrorBoundary
 */
export interface RemoteErrorBoundaryProps {
  /**
   * The component to wrap with error boundary
   */
  children: ReactNode;

  /**
   * Name of the remote MFE (e.g., 'authMfe', 'paymentsMfe')
   * @default 'unknown'
   */
  remoteName?: string;

  /**
   * Name of the component being loaded (for error message)
   */
  componentName: string;

  /**
   * Optional custom fallback component
   */
  fallback?: ReactNode;

  /**
   * Whether to enable automatic retries (default: true)
   */
  enableAutoRetry?: boolean;

  /**
   * Whether to track errors in Sentry (default: true)
   */
  enableSentryTracking?: boolean;

  /**
   * Callback when remote fails to load
   */
  onError?: (error: Error, remoteName: string) => void;

  /**
   * Callback when remote successfully loads after retry
   */
  onRecovery?: (remoteName: string) => void;
}

/**
 * Extended fallback props with retry functionality
 */
interface ExtendedFallbackProps extends FallbackProps {
  remoteName: string;
  componentName: string;
  circuitState: CircuitState;
  retryCount: number;
  isAutoRetrying: boolean;
  timeToRetry: number;
  onManualRetry: () => void;
}

/**
 * Loading state shown during automatic retries
 */
function RetryingFallback({
  componentName,
  retryCount,
  timeToRetry,
}: {
  componentName: string;
  retryCount: number;
  timeToRetry: number;
}) {
  const [countdown, setCountdown] = useState(Math.ceil(timeToRetry / 1000));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="min-h-[200px] flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-8 w-8 text-muted-foreground animate-spin"
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
        </div>
        <p className="text-sm text-muted-foreground">
          Loading {componentName}... (Attempt {retryCount + 1})
        </p>
        {countdown > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Retrying in {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Circuit breaker indicator component
 */
function CircuitBreakerStatus({
  circuitState,
  timeToRetry,
}: {
  circuitState: CircuitState;
  timeToRetry: number;
}) {
  if (circuitState === 'CLOSED') return null;

  const statusColor =
    circuitState === 'OPEN' ? 'bg-red-500' : 'bg-yellow-500';
  const statusText =
    circuitState === 'OPEN'
      ? `Service temporarily unavailable. Auto-retry in ${Math.ceil(timeToRetry / 1000)}s`
      : 'Testing service recovery...';

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <span className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span>{statusText}</span>
    </div>
  );
}

/**
 * Default error fallback component with retry functionality
 */
function DefaultErrorFallback({
  error,
  resetErrorBoundary: _resetErrorBoundary,
  remoteName,
  componentName,
  circuitState,
  retryCount,
  isAutoRetrying,
  timeToRetry,
  onManualRetry,
}: ExtendedFallbackProps) {
  const navigate = useNavigate();

  // Show loading UI during automatic retries
  if (isAutoRetrying) {
    return (
      <RetryingFallback
        componentName={componentName}
        retryCount={retryCount}
        timeToRetry={timeToRetry}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
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
          <CardTitle>Failed to Load {componentName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CircuitBreakerStatus
            circuitState={circuitState}
            timeToRetry={timeToRetry}
          />
          <p className="text-muted-foreground">
            We couldn't load the {componentName.toLowerCase()} module from{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {remoteName}
            </code>
            . This might be a temporary issue.
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Attempted {retryCount} automatic {retryCount === 1 ? 'retry' : 'retries'}.
            </p>
          )}
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
            <Button
              onClick={onManualRetry}
              disabled={circuitState === 'OPEN'}
            >
              {circuitState === 'OPEN' ? 'Please Wait...' : 'Try Again'}
            </Button>
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
 * Features:
 * - Automatic retries with exponential backoff
 * - Circuit breaker pattern for repeatedly failing remotes
 * - Sentry integration for error tracking
 * - User-friendly error UI with retry and navigation options
 *
 * @example
 * <RemoteErrorBoundary remoteName="authMfe" componentName="SignIn">
 *   <SignInComponent />
 * </RemoteErrorBoundary>
 */
export function RemoteErrorBoundary({
  children,
  remoteName = 'unknown',
  componentName,
  fallback,
  enableAutoRetry = true,
  enableSentryTracking = true,
  onError,
  onRecovery,
}: RemoteErrorBoundaryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [circuitState, setCircuitState] = useState<CircuitState>('CLOSED');
  const [timeToRetry, setTimeToRetry] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const boundaryRef = useRef<{ resetErrorBoundary?: () => void }>({});

  // Update circuit state periodically
  useEffect(() => {
    const updateCircuitState = () => {
      setCircuitState(remoteCircuitBreaker.getState(remoteName));
      setTimeToRetry(remoteCircuitBreaker.getTimeToRetry(remoteName));
    };

    updateCircuitState();
    const interval = setInterval(updateCircuitState, 1000);
    return () => clearInterval(interval);
  }, [remoteName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      // Record failure in circuit breaker
      remoteCircuitBreaker.recordFailure(remoteName, error);
      setCircuitState(remoteCircuitBreaker.getState(remoteName));
      setTimeToRetry(remoteCircuitBreaker.getTimeToRetry(remoteName));

      // Log error
      // eslint-disable-next-line no-console
      console.error(
        `[RemoteErrorBoundary] Failed to load ${componentName} from ${remoteName}:`,
        error
      );

      // Add breadcrumb for Sentry
      if (enableSentryTracking) {
        addBreadcrumb({
          category: 'mfe',
          message: `Remote load failed: ${remoteName}/${componentName}`,
          level: 'error',
          data: {
            remoteName,
            componentName,
            error: error.message,
            retryCount,
            circuitState: remoteCircuitBreaker.getState(remoteName),
          },
        });

        // Track in Sentry after max retries
        if (retryCount >= MAX_AUTO_RETRIES) {
          setTag('mfe_remote', remoteName);
          setTag('mfe_component', componentName);
          captureException(error, {
            remoteName,
            componentName,
            retryCount,
            circuitState: remoteCircuitBreaker.getState(remoteName),
            componentStack: errorInfo.componentStack,
          });
        }
      }

      // Call error callback
      onError?.(error, remoteName);

      // Attempt automatic retry if enabled and within limits
      if (
        enableAutoRetry &&
        retryCount < MAX_AUTO_RETRIES &&
        remoteCircuitBreaker.canRequest(remoteName)
      ) {
        const delay = calculateBackoffDelay(retryCount, {
          initialDelay: INITIAL_RETRY_DELAY,
          maxDelay: 5000,
          backoffFactor: 2,
        });

        setIsAutoRetrying(true);
        setTimeToRetry(delay);

        retryTimerRef.current = setTimeout(() => {
          setRetryCount(c => c + 1);
          setIsAutoRetrying(false);
          boundaryRef.current.resetErrorBoundary?.();
        }, delay);
      } else {
        setIsAutoRetrying(false);
      }
    },
    [
      remoteName,
      componentName,
      retryCount,
      enableAutoRetry,
      enableSentryTracking,
      onError,
    ]
  );

  const handleReset = useCallback(() => {
    // Record success in circuit breaker
    remoteCircuitBreaker.recordSuccess(remoteName);
    setCircuitState(remoteCircuitBreaker.getState(remoteName));

    // Reset retry count on successful render
    if (retryCount > 0) {
      setRetryCount(0);
      onRecovery?.(remoteName);
    }
  }, [remoteName, retryCount, onRecovery]);

  const handleManualRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    setRetryCount(c => c + 1);
    setIsAutoRetrying(false);
    boundaryRef.current.resetErrorBoundary?.();
  }, []);

  // Custom fallback renderer
  const FallbackRenderer = useCallback(
    (props: FallbackProps) => {
      // Store reset function for manual retry
      boundaryRef.current.resetErrorBoundary = props.resetErrorBoundary;

      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <DefaultErrorFallback
          {...props}
          remoteName={remoteName}
          componentName={componentName}
          circuitState={circuitState}
          retryCount={retryCount}
          isAutoRetrying={isAutoRetrying}
          timeToRetry={timeToRetry}
          onManualRetry={handleManualRetry}
        />
      );
    },
    [
      fallback,
      remoteName,
      componentName,
      circuitState,
      retryCount,
      isAutoRetrying,
      timeToRetry,
      handleManualRetry,
    ]
  );

  return (
    <ErrorBoundary
      FallbackComponent={FallbackRenderer}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
}

// Legacy export for backwards compatibility
export type { RemoteErrorBoundaryProps as RemoteErrorBoundaryLegacyProps };
