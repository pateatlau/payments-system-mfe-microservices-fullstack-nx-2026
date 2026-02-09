/**
 * Skeleton Component Tests
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('should render successfully', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have role="status" for screen readers', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have aria-busy="true"', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('should have default aria-label', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('should use custom label for aria-label', () => {
    render(<Skeleton label="Loading user avatar" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading user avatar');
  });

  it('should apply animate-pulse class', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should apply custom className', () => {
    render(<Skeleton className="h-4 w-[200px]" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-[200px]');
  });

  it('should apply rounded-md class', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('should apply bg-muted class', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('should pass through additional HTML attributes', () => {
    render(<Skeleton data-testid="custom-skeleton" />);
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
  });
});
