/**
 * PasswordInput Component Tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('should render password input with hidden text by default', () => {
    render(<PasswordInput placeholder="Enter password" />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should toggle password visibility when clicking the toggle button', () => {
    render(<PasswordInput placeholder="Enter password" />);

    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Initially password is hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should have correct aria-label on toggle button', () => {
    render(<PasswordInput placeholder="Enter password" />);

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    // After clicking, aria-label should change
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
  });

  it('should hide toggle button when showToggle is false', () => {
    render(<PasswordInput placeholder="Enter password" showToggle={false} />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toBeInTheDocument();

    // Toggle button should not exist
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<PasswordInput placeholder="Enter password" disabled />);

    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(
      <PasswordInput
        placeholder="Enter password"
        className="custom-class"
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    // The custom class is applied via cn() utility
    expect(input.className).toContain('custom-class');
  });

  it('should forward ref to input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<PasswordInput placeholder="Enter password" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Enter password');
  });

  it('should handle value changes', () => {
    const handleChange = jest.fn();
    render(
      <PasswordInput placeholder="Enter password" onChange={handleChange} />
    );

    const input = screen.getByPlaceholderText('Enter password');
    fireEvent.change(input, { target: { value: 'test123' } });

    expect(handleChange).toHaveBeenCalled();
  });
});
