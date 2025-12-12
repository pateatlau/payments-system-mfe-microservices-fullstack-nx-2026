/**
 * UserFormDialog Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserRole } from 'shared-types';
import { UserFormDialog } from './UserFormDialog';
import * as usersApi from '../api/users';

// Mock the users API
jest.mock('../api/users', () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
}));

describe('UserFormDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create form with all fields', () => {
      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Create New User')).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role/)).toBeInTheDocument();
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(usersApi.createUser).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/Email/);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const passwordInput = screen.getByLabelText(/Password/);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 12 characters/)
        ).toBeInTheDocument();
      });
    });

    it('should create user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        name: 'John Doe',
        role: UserRole.CUSTOMER,
        emailVerified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      (usersApi.createUser as jest.Mock).mockResolvedValue(mockUser);

      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const passwordInput = screen.getByLabelText(/Password/);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, {
        target: { value: 'SecurePassword123!' },
      });

      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(usersApi.createUser).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePassword123!',
          role: UserRole.CUSTOMER,
        });
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle API errors', async () => {
      (usersApi.createUser as jest.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const passwordInput = screen.getByLabelText(/Password/);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, {
        target: { value: 'SecurePassword123!' },
      });

      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should call onClose when cancel is clicked', () => {
      render(
        <UserFormDialog
          user={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe',
      role: UserRole.CUSTOMER,
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('should render edit form without password field', () => {
      render(
        <UserFormDialog
          user={mockUser}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Password/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Role/)).not.toBeInTheDocument();
      expect(screen.getByText('Update User')).toBeInTheDocument();
    });

    it('should pre-fill form with user data', () => {
      render(
        <UserFormDialog
          user={mockUser}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
    });

    it('should update user with valid data', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'John Smith',
        email: 'john.smith@example.com',
      };

      (usersApi.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      render(
        <UserFormDialog
          user={mockUser}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);

      fireEvent.change(nameInput, { target: { value: 'John Smith' } });
      fireEvent.change(emailInput, {
        target: { value: 'john.smith@example.com' },
      });

      const submitButton = screen.getByText('Update User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(usersApi.updateUser).toHaveBeenCalledWith('user-123', {
          name: 'John Smith',
          email: 'john.smith@example.com',
        });
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle API errors in edit mode', async () => {
      (usersApi.updateUser as jest.Mock).mockRejectedValue(
        new Error('Validation error')
      );

      render(
        <UserFormDialog
          user={mockUser}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Update User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Validation error')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
