import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="no-error">No Error</div>;
}

describe('RemoteErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <MemoryRouter>
        <RemoteErrorBoundary componentName="TestComponent">
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
        <RemoteErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </RemoteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText('Failed to Load Component')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't load the component from the remote/)).toBeInTheDocument();
  });

  it('displays error details when error occurs', () => {
    render(
      <MemoryRouter>
        <RemoteErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </RemoteErrorBoundary>
      </MemoryRouter>
    );

    const details = screen.getByText('Error Details');
    expect(details).toBeInTheDocument();
  });

  it('shows Try Again button in error fallback', () => {
    render(
      <MemoryRouter>
        <RemoteErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </RemoteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows Go Home button in error fallback', () => {
    render(
      <MemoryRouter>
        <RemoteErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </RemoteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error</div>;

    render(
      <MemoryRouter>
        <RemoteErrorBoundary componentName="TestComponent" fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </RemoteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });
});

