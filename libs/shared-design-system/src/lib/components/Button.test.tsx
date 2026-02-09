/**
 * Button Component Tests
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';

describe('Button', () => {
  it('should render successfully', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    const className = button.getAttribute('class') || '';
    expect(className).toMatch(
      /bg-\(--primary\)|bg-\[rgb\(var\(--primary\)\)\]/
    );
  });

  it('should apply destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    const className = button.getAttribute('class') || '';
    expect(className).toMatch(
      /bg-\(--destructive\)|bg-\[rgb\(var\(--destructive\)\)\]/
    );
  });

  it('should apply outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should handle onClick events', () => {
    let clicked = false;
    render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        Click
      </Button>
    );
    screen.getByRole('button').click();
    expect(clicked).toBe(true);
  });

  describe('loading state', () => {
    it('should show loading spinner when loading is true', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      // Check for SVG spinner (aria-hidden)
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have aria-busy when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should show loadingText when provided', () => {
      render(<Button loading loadingText="Saving...">Save</Button>);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show original children when not loading', () => {
      render(<Button loadingText="Saving...">Save</Button>);
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });
});
