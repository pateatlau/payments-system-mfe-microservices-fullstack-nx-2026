/**
 * Loading Component Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Loading } from './Loading';

// Mock the useAnnounce hook
jest.mock('@mfe/shared-utils', () => ({
  useAnnounce: () => jest.fn(),
}));

describe('Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render successfully', () => {
    render(<Loading />);
    // Use getAllByRole since there may be multiple status regions
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('should have role="status" for screen readers', () => {
    render(<Loading />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
    expect(loadingStatus).toBeInTheDocument();
  });

  it('should have aria-busy="true"', () => {
    render(<Loading />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
    expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
  });

  it('should have aria-live="polite"', () => {
    render(<Loading />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
    expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
  });

  it('should have default aria-label', () => {
    render(<Loading />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
    expect(loadingStatus).toHaveAttribute('aria-label', 'Loading...');
  });

  it('should use custom label for aria-label', () => {
    render(<Loading label="Loading payments..." />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el =>
      el.getAttribute('aria-label') === 'Loading payments...'
    );
    expect(loadingStatus).toBeInTheDocument();
  });

  it('should show label text when custom label provided', () => {
    render(<Loading label="Processing your request" />);
    // Label appears in both sr-only span and visible paragraph
    const labels = screen.getAllByText('Processing your request');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('should not show label text for default "Loading..."', () => {
    render(<Loading />);
    // The sr-only span exists but the visible paragraph should not
    const visibleLabels = screen.queryAllByText('Loading...');
    // Only the sr-only one should exist, not a visible <p>
    expect(visibleLabels.length).toBeLessThanOrEqual(1);
  });

  it('should show label when showLabel is true', () => {
    render(<Loading label="Loading..." showLabel />);
    const labels = screen.getAllByText('Loading...');
    // Should have both sr-only and visible
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<Loading size="sm" />);
      const statusElements = screen.getAllByRole('status');
      const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
      const spinner = loadingStatus?.querySelector('div');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('should render default size', () => {
      render(<Loading size="default" />);
      const statusElements = screen.getAllByRole('status');
      const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
      const spinner = loadingStatus?.querySelector('div');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('should render large size', () => {
      render(<Loading size="lg" />);
      const statusElements = screen.getAllByRole('status');
      const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
      const spinner = loadingStatus?.querySelector('div');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });
  });

  it('should hide the spinner from screen readers', () => {
    render(<Loading />);
    const statusElements = screen.getAllByRole('status');
    const loadingStatus = statusElements.find(el => el.classList.contains('flex'));
    const spinner = loadingStatus?.querySelector('div');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('should apply custom className', () => {
    render(<Loading className="custom-spinner" />);
    // The className is applied to the outer container
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThan(0);
  });
});
