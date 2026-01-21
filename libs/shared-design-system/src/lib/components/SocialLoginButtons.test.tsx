/**
 * SocialLoginButtons Component Tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocialLoginButtons } from './SocialLoginButtons';

describe('SocialLoginButtons', () => {
  const mockOnProviderClick = jest.fn();

  beforeEach(() => {
    mockOnProviderClick.mockClear();
  });

  it('should render default enabled providers (Google and GitHub)', () => {
    render(<SocialLoginButtons onProviderClick={mockOnProviderClick} />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Continue with Facebook')).not.toBeInTheDocument();
  });

  it('should render only specified providers', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        enabledProviders={['google', 'facebook', 'linkedin']}
      />
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.queryByText('Continue with GitHub')).not.toBeInTheDocument();
  });

  it('should render all providers when all are enabled', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        enabledProviders={['google', 'github', 'facebook', 'linkedin', 'twitter']}
      />
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Continue with X')).toBeInTheDocument();
  });

  it('should call onProviderClick with correct provider ID when button is clicked', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        enabledProviders={['google', 'github']}
      />
    );

    const googleButton = screen.getByLabelText('Continue with Google');
    const githubButton = screen.getByLabelText('Continue with GitHub');

    fireEvent.click(googleButton);
    expect(mockOnProviderClick).toHaveBeenCalledWith('google');

    fireEvent.click(githubButton);
    expect(mockOnProviderClick).toHaveBeenCalledWith('github');
  });

  it('should disable all buttons when disabled prop is true', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        disabled={true}
        enabledProviders={['google', 'github']}
      />
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    const githubButton = screen.getByText('Continue with GitHub').closest('button');

    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it('should disable all buttons when one is loading', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        loading="google"
        enabledProviders={['google', 'github']}
      />
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    const githubButton = screen.getByText('Continue with GitHub').closest('button');

    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it('should show loading spinner for the loading provider', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        loading="google"
        enabledProviders={['google', 'github']}
      />
    );

    // The loading button should contain an animated spinner
    const googleButton = screen.getByText('Continue with Google').closest('button');
    const spinner = googleButton?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should have accessible labels on buttons', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        enabledProviders={['google', 'github']}
      />
    );

    expect(screen.getByLabelText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByLabelText('Continue with GitHub')).toBeInTheDocument();
  });

  it('should apply custom className to container', () => {
    const { container } = render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should not call onProviderClick when button is disabled', () => {
    render(
      <SocialLoginButtons
        onProviderClick={mockOnProviderClick}
        disabled={true}
      />
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    fireEvent.click(googleButton!);

    expect(mockOnProviderClick).not.toHaveBeenCalled();
  });

  it('should render buttons with correct type="button" to prevent form submission', () => {
    render(<SocialLoginButtons onProviderClick={mockOnProviderClick} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
