import { render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  describe('rendering', () => {
    it('renders children content', () => {
      render(<LiveRegion data-testid="live-region">Status message</LiveRegion>);

      expect(screen.getByTestId('live-region')).toHaveTextContent(
        'Status message'
      );
    });

    it('renders with default props', () => {
      render(<LiveRegion data-testid="live-region">Content</LiveRegion>);

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('role', 'status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
      expect(region).toHaveAttribute('aria-relevant', 'additions text');
    });

    it('applies custom className', () => {
      render(
        <LiveRegion className="custom-class" data-testid="live-region">
          Content
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveClass('custom-class');
    });

    it('forwards ref to div element', () => {
      const ref = { current: null };
      render(
        <LiveRegion ref={ref} data-testid="live-region">
          Content
        </LiveRegion>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('politeness levels', () => {
    it('uses polite politeness by default', () => {
      render(<LiveRegion data-testid="live-region">Content</LiveRegion>);

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('role', 'status');
    });

    it('uses assertive politeness when specified', () => {
      render(
        <LiveRegion politeness="assertive" data-testid="live-region">
          Urgent content
        </LiveRegion>
      );

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('aria-live', 'assertive');
      expect(region).toHaveAttribute('role', 'alert');
    });

    it('can disable live region with off politeness', () => {
      render(
        <LiveRegion politeness="off" data-testid="live-region">
          Silent content
        </LiveRegion>
      );

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('aria-live', 'off');
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-atomic to true by default', () => {
      render(<LiveRegion data-testid="live-region">Content</LiveRegion>);

      expect(screen.getByTestId('live-region')).toHaveAttribute(
        'aria-atomic',
        'true'
      );
    });

    it('can set aria-atomic to false', () => {
      render(
        <LiveRegion atomic={false} data-testid="live-region">
          Content
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveAttribute(
        'aria-atomic',
        'false'
      );
    });

    it('sets default aria-relevant', () => {
      render(<LiveRegion data-testid="live-region">Content</LiveRegion>);

      expect(screen.getByTestId('live-region')).toHaveAttribute(
        'aria-relevant',
        'additions text'
      );
    });

    it('can set custom aria-relevant', () => {
      render(
        <LiveRegion relevant="all" data-testid="live-region">
          Content
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveAttribute(
        'aria-relevant',
        'all'
      );
    });

    it('can set aria-relevant to additions only', () => {
      render(
        <LiveRegion relevant="additions" data-testid="live-region">
          Content
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveAttribute(
        'aria-relevant',
        'additions'
      );
    });
  });

  describe('visual hiding', () => {
    it('applies sr-only class by default', () => {
      render(<LiveRegion data-testid="live-region">Content</LiveRegion>);

      expect(screen.getByTestId('live-region')).toHaveClass('sr-only');
    });

    it('does not apply sr-only when visuallyHidden is false', () => {
      render(
        <LiveRegion visuallyHidden={false} data-testid="live-region">
          Visible content
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).not.toHaveClass('sr-only');
    });
  });

  describe('dynamic content', () => {
    it('updates content when children change', () => {
      const { rerender } = render(
        <LiveRegion data-testid="live-region">Initial</LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveTextContent('Initial');

      rerender(<LiveRegion data-testid="live-region">Updated</LiveRegion>);

      expect(screen.getByTestId('live-region')).toHaveTextContent('Updated');
    });

    it('can render complex children', () => {
      render(
        <LiveRegion data-testid="live-region">
          <span>First part</span>
          <span> - Second part</span>
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveTextContent(
        'First part - Second part'
      );
    });

    it('handles empty children', () => {
      render(<LiveRegion data-testid="live-region">{null}</LiveRegion>);

      expect(screen.getByTestId('live-region')).toBeEmptyDOMElement();
    });

    it('handles conditional content', () => {
      const showMessage = true;
      render(
        <LiveRegion data-testid="live-region">
          {showMessage && 'Conditional message'}
        </LiveRegion>
      );

      expect(screen.getByTestId('live-region')).toHaveTextContent(
        'Conditional message'
      );
    });
  });

  describe('accessibility', () => {
    it('is accessible to screen readers when visually hidden', () => {
      render(<LiveRegion data-testid="live-region">Screen reader content</LiveRegion>);

      // The region should still be in the DOM and accessible
      const region = screen.getByTestId('live-region');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('role', 'status');
    });

    it('can be used for error messages with alert role', () => {
      render(
        <LiveRegion politeness="assertive" data-testid="live-region">
          Error: Something went wrong
        </LiveRegion>
      );

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('role', 'alert');
      expect(region).toHaveTextContent('Error: Something went wrong');
    });

    it('can be used for status updates with status role', () => {
      render(
        <LiveRegion politeness="polite" data-testid="live-region">
          Loading... 50% complete
        </LiveRegion>
      );

      const region = screen.getByTestId('live-region');
      expect(region).toHaveAttribute('role', 'status');
      expect(region).toHaveTextContent('Loading... 50% complete');
    });
  });
});
