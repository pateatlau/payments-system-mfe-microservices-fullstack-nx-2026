/**
 * SkipLink Component Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as React from 'react';
import { SkipLink } from './SkipLink';

expect.extend(toHaveNoViolations);

// Mock scrollIntoView since jsdom doesn't implement it
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('SkipLink', () => {
  describe('Rendering', () => {
    it('renders with default text', () => {
      render(<SkipLink targetId="main-content" />);
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<SkipLink targetId="main-content">Skip to navigation</SkipLink>);
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('has correct href attribute', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('applies custom className', () => {
      render(<SkipLink targetId="main-content" className="custom-class" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(<SkipLink targetId="main-content" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('Behavior', () => {
    it('focuses target element on click', () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content" data-testid="target">
            Main Content
          </div>
        </>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      const target = screen.getByTestId('target');
      expect(target).toHaveFocus();
    });

    it('adds tabindex to target if not present', () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content" data-testid="target">
            Main Content
          </div>
        </>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      const target = screen.getByTestId('target');
      expect(target).toHaveAttribute('tabindex', '-1');
    });

    it('does not override existing tabindex', () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content" tabIndex={0} data-testid="target">
            Main Content
          </div>
        </>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      const target = screen.getByTestId('target');
      expect(target).toHaveAttribute('tabindex', '0');
    });

    it('handles missing target gracefully', () => {
      render(<SkipLink targetId="non-existent" />);

      const link = screen.getByRole('link');

      // Should not throw
      expect(() => fireEvent.click(link)).not.toThrow();
    });

    it('calls onClick handler if provided', () => {
      const handleClick = jest.fn();

      render(
        <>
          <SkipLink targetId="main-content" onClick={handleClick} />
          <div id="main-content">Main Content</div>
        </>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls scrollIntoView on target', () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content" data-testid="target">Main Content</div>
        </>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      const target = screen.getByTestId('target');
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('is focusable via Tab key', async () => {
      const user = userEvent.setup();

      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content">Main Content</div>
        </>
      );

      await user.tab();

      const link = screen.getByRole('link');
      expect(link).toHaveFocus();
    });

    it('activates on Enter key press via fireEvent', () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <div id="main-content" data-testid="target">
            Main Content
          </div>
        </>
      );

      const link = screen.getByRole('link');
      link.focus();

      // Simulate Enter key - browsers typically fire click on Enter for links
      fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
      fireEvent.click(link);

      const target = screen.getByTestId('target');
      expect(target).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <>
          <SkipLink targetId="main-content" />
          <main id="main-content">Main Content</main>
        </>
      );

      const results = await axe(container, {
        rules: {
          region: { enabled: false },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('has accessible link role', () => {
      render(<SkipLink targetId="main-content" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('has descriptive link text', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Skip to main content');
    });
  });

  describe('Visual States', () => {
    it('has sr-only class by default (visually hidden)', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('sr-only');
    });

    it('has focus styles for visibility on focus', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:not-sr-only');
      expect(link).toHaveClass('focus:fixed');
    });
  });
});
