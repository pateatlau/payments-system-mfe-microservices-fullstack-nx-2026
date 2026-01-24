/**
 * Accessibility Tests for Design System Components
 *
 * These tests verify WCAG 2.1 AA compliance for all shared design system components
 * using jest-axe for automated accessibility audits.
 *
 * @module shared-design-system/accessibility
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as React from 'react';

// Components to test
import { Button } from './Button';
import { Input } from './Input';
import { PasswordInput } from './PasswordInput';
import { Label } from './Label';
import { Alert, AlertTitle, AlertDescription } from './Alert';
import { Badge } from './Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Loading } from './Loading';
import { Skeleton } from './Skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './Select';
import { StatusBadge } from './StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { Toast, ToastContainer } from './Toast';
import { SocialLoginButtons } from './SocialLoginButtons';

// Ensure jest-axe matchers are available
expect.extend(toHaveNoViolations);

// Default axe configuration for component tests
const axeOptions = {
  rules: {
    // Disable region rule - components are tested in isolation
    region: { enabled: false },
  },
};

describe('Design System Accessibility', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all variants', async () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        const results = await axe(container, axeOptions);
        expect(results).toHaveNoViolations();
      }
    });

    it('should have no violations for icon button', async () => {
      const { container } = render(
        <Button size="icon" aria-label="Close">
          <span aria-hidden="true">×</span>
        </Button>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Input Component', () => {
    it('should have no violations with label', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" />
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when disabled', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="disabled-input">Disabled Field</Label>
          <Input id="disabled-input" disabled />
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with aria-describedby for errors', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="error-input">Email</Label>
          <Input
            id="error-input"
            type="email"
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <p id="error-message" role="alert">Please enter a valid email</p>
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for required input', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="required-input">Name *</Label>
          <Input id="required-input" aria-required="true" required />
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('PasswordInput Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" />
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible toggle button', async () => {
      render(
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" />
        </div>
      );

      // Check toggle button has accessible name
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });

  describe('Alert Component', () => {
    it('should have no violations for default alert', async () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>This is an informational message.</AlertDescription>
        </Alert>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all variants', async () => {
      const variants = ['default', 'destructive', 'success', 'warning', 'info'] as const;

      for (const variant of variants) {
        const { container } = render(
          <Alert variant={variant}>
            <AlertTitle>{variant} Alert</AlertTitle>
            <AlertDescription>Alert content for {variant}.</AlertDescription>
          </Alert>
        );
        const results = await axe(container, axeOptions);
        expect(results).toHaveNoViolations();
      }
    });

    it('should have role="alert" attribute', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Badge>Status</Badge>);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all variants', async () => {
      const variants = ['default', 'secondary', 'destructive', 'outline'] as const;

      for (const variant of variants) {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        const results = await axe(container, axeOptions);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Card Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Loading />);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have role="status" for screen readers', () => {
      render(<Loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<Loading />);
      const status = screen.getByRole('status');
      // Should have either aria-label or visible text
      expect(
        status.getAttribute('aria-label') ||
        status.textContent
      ).toBeTruthy();
    });
  });

  describe('Skeleton Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Select Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="select">Choose option</Label>
          <Select>
            <SelectTrigger id="select">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Option 1</SelectItem>
              <SelectItem value="2">Option 2</SelectItem>
              <SelectItem value="3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('StatusBadge Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<StatusBadge status="COMPLETED" />);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all statuses', async () => {
      const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

      for (const status of statuses) {
        const { container } = render(<StatusBadge status={status} />);
        const results = await axe(container, axeOptions);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('ThemeToggle Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ThemeToggle />);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible button with aria-label', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('Toast Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Toast
          title="Success"
          description="Operation completed"
          variant="default"
          onClose={() => {}}
        />
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all variants', async () => {
      const variants = ['default', 'destructive', 'success'] as const;

      for (const variant of variants) {
        const { container } = render(
          <Toast
            title={`${variant} Toast`}
            description="Description text"
            variant={variant}
            onClose={() => {}}
          />
        );
        const results = await axe(container, axeOptions);
        expect(results).toHaveNoViolations();
      }
    });

    it('should have role="alert" for screen reader announcement', () => {
      render(
        <Toast
          title="Alert"
          description="Important message"
          variant="default"
          onClose={() => {}}
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('ToastContainer Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ToastContainer />);
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SocialLoginButtons Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <SocialLoginButtons onSocialLogin={() => {}} />
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible names for all social buttons', () => {
      render(<SocialLoginButtons onSocialLogin={() => {}} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Each button should have accessible text content or aria-label
        expect(
          button.textContent ||
          button.getAttribute('aria-label')
        ).toBeTruthy();
      });
    });
  });

  describe('Label Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Field Label</Label>
          <input id="test-input" />
        </div>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should associate with input via htmlFor', () => {
      render(
        <div>
          <Label htmlFor="associated-input">Label Text</Label>
          <Input id="associated-input" />
        </div>
      );

      const label = screen.getByText('Label Text');
      expect(label).toHaveAttribute('for', 'associated-input');
    });
  });

  describe('Form Patterns', () => {
    it('should have no violations for complete form pattern', async () => {
      const { container } = render(
        <form aria-label="Contact form">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" aria-required="true" required />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" aria-required="true" required />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Input id="message" />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for form with error state', async () => {
      const { container } = render(
        <form aria-label="Login form">
          <div>
            <Label htmlFor="error-email">Email</Label>
            <Input
              id="error-email"
              type="email"
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <p id="email-error" role="alert" className="text-destructive">
              Please enter a valid email address
            </p>
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });
});
