import { render, screen } from '@testing-library/react';
import { FormField, useFormField } from './FormField';
import { Input } from './Input';

describe('FormField', () => {
  describe('rendering', () => {
    it('renders label and children', () => {
      render(
        <FormField name="email" label="Email Address">
          <Input type="email" />
        </FormField>
      );

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <FormField
          name="email"
          label="Email Address"
          description="We'll never share your email"
        >
          <Input type="email" />
        </FormField>
      );

      expect(
        screen.getByText("We'll never share your email")
      ).toBeInTheDocument();
    });

    it('renders error message when provided', () => {
      render(
        <FormField name="email" label="Email Address" error="Email is required">
          <Input type="email" />
        </FormField>
      );

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(
        <FormField name="email" label="Email Address" required>
          <Input type="email" />
        </FormField>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('(required)')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <FormField name="email" label="Email Address" className="custom-class">
          <Input type="email" />
        </FormField>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('hides label visually when hideLabel is true', () => {
      render(
        <FormField name="email" label="Email Address" hideLabel>
          <Input type="email" />
        </FormField>
      );

      const label = screen.getByText('Email Address');
      expect(label).toHaveClass('sr-only');
    });
  });

  describe('accessibility - ID associations', () => {
    it('associates label with input via htmlFor/id', () => {
      render(
        <FormField name="email" label="Email Address">
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'field-email');
    });

    it('links input to description via aria-describedby', () => {
      render(
        <FormField
          name="email"
          label="Email Address"
          description="Enter your email"
        >
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute(
        'aria-describedby',
        'field-email-description'
      );

      const description = screen.getByText('Enter your email');
      expect(description).toHaveAttribute('id', 'field-email-description');
    });

    it('links input to error via aria-describedby', () => {
      render(
        <FormField name="email" label="Email Address" error="Email is required">
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-describedby', 'field-email-error');

      const errorMessage = screen.getByText('Email is required');
      expect(errorMessage).toHaveAttribute('id', 'field-email-error');
    });

    it('links input to both description and error when both present', () => {
      render(
        <FormField
          name="email"
          label="Email Address"
          description="Enter your email"
          error="Email is required"
        >
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute(
        'aria-describedby',
        'field-email-description field-email-error'
      );
    });
  });

  describe('accessibility - ARIA attributes', () => {
    it('sets aria-invalid when error is present', () => {
      render(
        <FormField name="email" label="Email Address" error="Invalid email">
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when no error', () => {
      render(
        <FormField name="email" label="Email Address">
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('sets aria-required when required', () => {
      render(
        <FormField name="email" label="Email Address" required>
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when not required', () => {
      render(
        <FormField name="email" label="Email Address">
          <Input type="email" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).not.toHaveAttribute('aria-required');
    });

    it('error message has role="alert"', () => {
      render(
        <FormField name="email" label="Email Address" error="Email is required">
          <Input type="email" />
        </FormField>
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Email is required');
    });

    // Note: role="alert" implies aria-live="assertive", so we don't add aria-live="polite"
    // which would conflict. The role="alert" provides the necessary live region behavior.
  });

  describe('useFormField hook', () => {
    function TestComponent() {
      const { id, hasError, isRequired, ariaDescribedBy } = useFormField();
      return (
        <div data-testid="test">
          <span data-testid="id">{id}</span>
          <span data-testid="hasError">{hasError ? 'yes' : 'no'}</span>
          <span data-testid="isRequired">{isRequired ? 'yes' : 'no'}</span>
          <span data-testid="ariaDescribedBy">{ariaDescribedBy || 'none'}</span>
        </div>
      );
    }

    it('provides correct context values', () => {
      render(
        <FormField
          name="test"
          label="Test"
          error="Error"
          description="Desc"
          required
        >
          <TestComponent />
        </FormField>
      );

      expect(screen.getByTestId('id')).toHaveTextContent('field-test');
      expect(screen.getByTestId('hasError')).toHaveTextContent('yes');
      expect(screen.getByTestId('isRequired')).toHaveTextContent('yes');
      expect(screen.getByTestId('ariaDescribedBy')).toHaveTextContent(
        'field-test-description field-test-error'
      );
    });

    it('throws error when used outside FormField', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useFormField must be used within a FormField'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('multiple children', () => {
    it('applies accessibility props to all valid element children with unique IDs', () => {
      render(
        <FormField name="multi" label="Multi Input" required>
          <Input type="text" data-testid="input1" />
          <Input type="text" data-testid="input2" />
        </FormField>
      );

      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');

      // First child gets base ID, subsequent children get indexed IDs to avoid duplicates
      expect(input1).toHaveAttribute('id', 'field-multi');
      expect(input1).toHaveAttribute('aria-required', 'true');
      expect(input2).toHaveAttribute('id', 'field-multi-1');
      expect(input2).toHaveAttribute('aria-required', 'true');
    });

    it('preserves explicit IDs on children', () => {
      render(
        <FormField name="multi" label="Multi Input">
          <Input type="text" id="custom-id" data-testid="input1" />
          <Input type="text" data-testid="input2" />
        </FormField>
      );

      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');

      // Child with explicit ID keeps it, other gets indexed ID
      expect(input1).toHaveAttribute('id', 'custom-id');
      expect(input2).toHaveAttribute('id', 'field-multi-1');
    });
  });

  describe('error state styling', () => {
    it('applies error styling to label when error present', () => {
      render(
        <FormField name="email" label="Email Address" error="Error">
          <Input type="email" />
        </FormField>
      );

      // Find the label (which contains the text directly)
      const label = screen.getByText('Email Address').closest('label');
      expect(label).toHaveClass('text-[rgb(var(--destructive))]');
    });
  });
});
