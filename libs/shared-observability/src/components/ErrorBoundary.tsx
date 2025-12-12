/**
 * Sentry Error Boundary Component
 *
 * Wraps React components to catch and report errors to Sentry.
 * Provides a fallback UI when errors occur.
 */

import * as Sentry from '@sentry/react';
import { Component, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((error: Error, errorInfo: React.ErrorInfo) => ReactNode);
  showDialog?: boolean;
  beforeCapture?: (
    scope: Sentry.Scope,
    error: Error,
    errorInfo: React.ErrorInfo
  ) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that integrates with Sentry
 *
 * Automatically captures React errors and displays a fallback UI.
 * Uses Sentry's ErrorBoundary for error tracking.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (process.env['NODE_ENV'] === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Additional error handling can be added here if needed
    // Sentry's ErrorBoundary will automatically capture the error
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const error = this.state.error || new Error('Unknown error');

      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, {
            componentStack: '',
          });
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            We're sorry, but something unexpected happened. Please try
            refreshing the page.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
          {process.env['NODE_ENV'] === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                textAlign: 'left',
                maxWidth: '600px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: '1rem',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Sentry Error Boundary wrapper
 *
 * Uses Sentry's built-in ErrorBoundary component which automatically
 * captures errors and sends them to Sentry.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
