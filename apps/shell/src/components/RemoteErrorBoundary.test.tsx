import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';
import { remoteCircuitBreaker } from '@mfe/shared-utils';

// Mock Sentry observability
jest.mock('@mfe-poc/shared-observability', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTag: jest.fn(),
}));

// Component that throws an error for testing
function ThrowError({
  shouldThrow,
  message = 'Test error',
}: {
  shouldThrow: boolean;
  message?: string;
}) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="no-error">No Error</div>;
}

describe('RemoteErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset circuit breaker state before each test
    remoteCircuitBreaker.resetAll();
    // Use fake timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('renders children when no error occurs', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
          >
            <div data-testid="test-content">Test Content</div>
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders error fallback when error occurs', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(
        screen.getByText('Failed to Load TestComponent')
      ).toBeInTheDocument();
    });

    it('displays error details when error occurs', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} message="Specific error message" />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      const details = screen.getByText('Error Details');
      expect(details).toBeInTheDocument();
    });

    it('shows Try Again button in error fallback', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows Go Home button in error fallback', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('uses custom fallback when provided', () => {
      const customFallback = (
        <div data-testid="custom-fallback">Custom Error</div>
      );

      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            fallback={customFallback}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('displays remote name in error message', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="authMfe"
            componentName="SignIn"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(screen.getByText('authMfe')).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('shows retrying UI during automatic retry', async () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={true}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      // Should show retrying UI (spinner and attempt count)
      await waitFor(() => {
        expect(
          screen.getByText(/Loading TestComponent/i)
        ).toBeInTheDocument();
      });
    });

    it('shows retry attempt count in loading UI', async () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={true}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      // Should show attempt count in retrying UI
      await waitFor(() => {
        expect(
          screen.getByText(/Attempt 1/i)
        ).toBeInTheDocument();
      });
    });

    it('disables auto retry when enableAutoRetry is false', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      // Should immediately show error fallback, not retrying UI
      expect(
        screen.getByText('Failed to Load TestComponent')
      ).toBeInTheDocument();
      expect(screen.queryByText(/Loading TestComponent/i)).not.toBeInTheDocument();
    });
  });

  describe('circuit breaker', () => {
    it('records failure in circuit breaker', () => {
      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      const state = remoteCircuitBreaker.getState('testMfe');
      // After one failure, circuit should still be CLOSED (threshold is 3)
      expect(state).toBe('CLOSED');
    });

    it('opens circuit after multiple failures', () => {
      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        remoteCircuitBreaker.recordFailure(
          'failingMfe',
          new Error('Test error')
        );
      }

      const state = remoteCircuitBreaker.getState('failingMfe');
      expect(state).toBe('OPEN');
    });

    it('disables Try Again button when circuit is open', () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        remoteCircuitBreaker.recordFailure(
          'blockedMfe',
          new Error('Test error')
        );
      }

      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="blockedMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      const tryAgainButton = screen.getByRole('button', {
        name: /Please Wait/i,
      });
      expect(tryAgainButton).toBeDisabled();
    });
  });

  describe('callbacks', () => {
    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
            onError={onError}
          >
            <ThrowError shouldThrow={true} message="Callback test error" />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'testMfe'
      );
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Callback test error' }),
        'testMfe'
      );
    });
  });

  describe('Sentry integration', () => {
    it('adds breadcrumb when error occurs', async () => {
      const { addBreadcrumb } = jest.requireMock(
        '@mfe-poc/shared-observability'
      ) as { addBreadcrumb: jest.Mock };

      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
            enableSentryTracking={true}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'mfe',
          message: 'Remote load failed: testMfe/TestComponent',
          level: 'error',
        })
      );
    });

    it('does not track in Sentry when enableSentryTracking is false', () => {
      const { addBreadcrumb, captureException } = jest.requireMock(
        '@mfe-poc/shared-observability'
      ) as { addBreadcrumb: jest.Mock; captureException: jest.Mock };

      render(
        <MemoryRouter>
          <RemoteErrorBoundary
            remoteName="testMfe"
            componentName="TestComponent"
            enableAutoRetry={false}
            enableSentryTracking={false}
          >
            <ThrowError shouldThrow={true} />
          </RemoteErrorBoundary>
        </MemoryRouter>
      );

      expect(addBreadcrumb).not.toHaveBeenCalled();
      expect(captureException).not.toHaveBeenCalled();
    });
  });
});
