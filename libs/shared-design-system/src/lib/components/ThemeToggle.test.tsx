/**
 * ThemeToggle Component Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeToggle } from './ThemeToggle';

// Mock the shared-theme-store
const mockSetTheme = jest.fn();
const mockUseTheme = jest.fn();

jest.mock('@mfe/shared-theme-store', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTheme.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render successfully', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render sun icon in light mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button.querySelector('svg circle')).toBeInTheDocument(); // Sun icon has circle
    });

    it('should render moon icon in dark mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Switch to system preference'
      );
      expect(button.querySelector('svg path')).toBeInTheDocument(); // Moon icon has path
    });

    it('should render monitor icon in system mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(button.querySelector('svg rect')).toBeInTheDocument(); // Monitor icon has rect
    });

    it('should render label when showLabel is true', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle showLabel />);
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should not render label by default', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      expect(screen.queryByText('Light')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Theme Cycling', () => {
    it('should cycle from light to dark', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
      });
    });

    it('should cycle from dark to system', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('system');
      });
    });

    it('should cycle from system to light', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('light');
      });
    });

    it('should handle multiple clicks correctly', async () => {
      const user = userEvent.setup();

      // Start with light theme
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      const { rerender } = render(<ThemeToggle />);
      const button = screen.getByRole('button');

      // First click: light → dark
      await user.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);

      // Update mock to reflect new state and rerender
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        isLoading: false,
      });
      rerender(<ThemeToggle />);

      // Second click: dark → system
      await user.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('system');
      expect(mockSetTheme).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label for each theme', () => {
      // Light mode
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });
      const { rerender } = render(<ThemeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );

      // Dark mode
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        isLoading: false,
      });
      rerender(<ThemeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to system preference'
      );

      // System mode
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });
      rerender(<ThemeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should have title attribute for tooltip', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('should have type="button" to prevent form submission', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have focus-visible styles', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
      });
    });
  });

  describe('Variants', () => {
    it('should accept button variant', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle variant="button" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should warn when dropdown variant is used', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        isLoading: false,
      });

      render(<ThemeToggle variant="dropdown" />);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('dropdown variant not yet implemented')
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
