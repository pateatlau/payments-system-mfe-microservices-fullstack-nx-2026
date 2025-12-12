import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector('button');

    expect(button).toBeDefined();
    expect(button?.style.backgroundColor).toBe('rgb(0, 102, 204)'); // #0066cc
  });

  it('renders secondary variant', () => {
    const { container } = render(
      <Button variant="secondary">Secondary</Button>
    );
    const button = container.querySelector('button');

    expect(button).toBeDefined();
    expect(button?.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with custom type attribute', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole('button');
    expect(button.getAttribute('type')).toBe('submit');
  });
});
