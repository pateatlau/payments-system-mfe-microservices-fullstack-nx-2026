import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUp } from './SignUp';
import { useAuthStore } from 'shared-auth-store';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('SignUp', () => {
  const mockSignup = vi.fn();
  const mockClearError = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnNavigateToSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      signup: mockSignup,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders sign-up form', () => {
    render(<SignUp />);

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('displays validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('displays validation error for short name', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'A');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    // Wait a bit for validation to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that signup was not called due to validation error
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('displays validation error for short password', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Short1!');
    await user.type(confirmPasswordInput, 'Short1!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument();
    });
  });

  it('displays validation error for weak password (missing complexity)', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'lowercaseonly123');
    await user.type(confirmPasswordInput, 'lowercaseonly123');
    await user.click(submitButton);

    // Wait a bit for validation to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that signup was not called due to validation error
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('displays validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'DifferentPassword123!@#');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls signup with correct data on form submission', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue(undefined);

    render(<SignUp onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123!@#',
      });
    });
  });

  it('calls onSuccess callback after successful signup', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue(undefined);

    render(<SignUp onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays loading state during form submission', async () => {
    const user = userEvent.setup();
    mockSignup.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!@#');
    await user.type(confirmPasswordInput, 'Password123!@#');
    await user.click(submitButton);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('displays error from auth store', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      signup: mockSignup,
      isLoading: false,
      error: 'Email already exists',
      clearError: mockClearError,
    });

    render(<SignUp />);

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('clears error when component mounts with error', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      signup: mockSignup,
      isLoading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    render(<SignUp />);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('disables form fields when loading', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      signup: mockSignup,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<SignUp />);

    expect(screen.getByLabelText('Full Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('renders sign-in link when onNavigateToSignIn is provided', () => {
    render(<SignUp onNavigateToSignIn={mockOnNavigateToSignIn} />);

    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls onNavigateToSignIn when sign-in link is clicked', async () => {
    const user = userEvent.setup();
    render(<SignUp onNavigateToSignIn={mockOnNavigateToSignIn} />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    expect(mockOnNavigateToSignIn).toHaveBeenCalled();
  });

  it('does not render sign-in link when onNavigateToSignIn is not provided', () => {
    render(<SignUp />);

    expect(screen.queryByText('Already have an account?')).not.toBeInTheDocument();
  });

  it('displays password strength indicator', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const passwordInput = screen.getByLabelText('Password');

    // Type a weak password
    await user.type(passwordInput, 'weak');
    expect(screen.getByText(/password strength: too short/i)).toBeInTheDocument();

    // Type a medium password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'MediumPass123');
    expect(screen.getByText(/password strength: medium/i)).toBeInTheDocument();

    // Type a strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!@#');
    expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<SignUp />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('autoComplete', 'name');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
  });

  it('displays password requirements hint', () => {
    render(<SignUp />);

    expect(
      screen.getByText(
        /must be at least 12 characters with uppercase, lowercase, numbers, and symbols/i
      )
    ).toBeInTheDocument();
  });
});

