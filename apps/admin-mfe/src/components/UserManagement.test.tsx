/**
 * UserManagement Component Tests
 */

import { render, screen, fireEvent, waitFor } from '../test-utils';
import { UserRole } from 'shared-types';
import { UserManagement } from './UserManagement';
import * as usersApi from '../api/users';

// Mock ResizeObserver for Radix UI Select
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock PointerEvent for Radix UI
  class MockPointerEvent extends Event {
    button: number;
    ctrlKey: boolean;
    pointerType: string;

    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props);
      this.button = props.button ?? 0;
      this.ctrlKey = props.ctrlKey ?? false;
      this.pointerType = props.pointerType ?? 'mouse';
    }
  }

  global.PointerEvent =
    MockPointerEvent as unknown as typeof globalThis.PointerEvent;

  // Mock pointer capture methods
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = () => {};
});

// Mock the users API
jest.mock('../api/users', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserRole: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock child components
jest.mock('./UserFormDialog', () => ({
  UserFormDialog: ({
    onClose,
    onSubmit,
  }: {
    onClose: () => void;
    onSubmit: () => void;
  }) => (
    <div data-testid="user-form-dialog">
      <button onClick={onClose}>Cancel</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

jest.mock('./DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({
    onCancel,
    onConfirm,
  }: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => (
    <div data-testid="delete-confirm-dialog">
      <button onClick={onCancel}>Cancel Delete</button>
      <button onClick={onConfirm}>Confirm Delete</button>
    </div>
  ),
}));

describe('UserManagement', () => {
  const mockUsers = [
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      role: UserRole.CUSTOMER,
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      role: UserRole.ADMIN,
      emailVerified: false,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usersApi.getUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination,
    });
  });

  it('should render user management header', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(
        screen.getByText('Manage users, roles, and permissions')
      ).toBeInTheDocument();
    });
  });

  it('should load and display users', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    expect(usersApi.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      role: undefined,
      search: '',
    });
  });

  it('should display loading state', () => {
    (usersApi.getUsers as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<UserManagement />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading component
  });

  it('should display error message on API failure', async () => {
    (usersApi.getUsers as jest.Mock).mockRejectedValue(
      new Error('Failed to load users')
    );

    render(<UserManagement />);

    await waitFor(
      () => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should display empty state when no users', async () => {
    (usersApi.getUsers as jest.Mock).mockResolvedValue({
      users: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('should filter users by search', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: undefined,
        search: 'john',
      });
    });
  });

  it('should render role filter dropdown', async () => {
    // Note: Testing Radix UI Select interactions requires complex portal handling.
    // We verify the filter trigger renders correctly.
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify the role filter trigger is rendered
    const roleFilterTrigger = screen.getByRole('combobox', {
      name: /filter by role/i,
    });
    expect(roleFilterTrigger).toBeInTheDocument();
    expect(screen.getByText('All Roles')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    (usersApi.getUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        role: undefined,
        search: '',
      });
    });
  });

  it('should disable previous button on first page', async () => {
    (usersApi.getUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    render(<UserManagement />);

    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should open create user dialog', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-form-dialog')).toBeInTheDocument();
    });
  });

  it('should open edit user dialog', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('user-form-dialog')).toBeInTheDocument();
    });
  });

  it('should reload users after form submission', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-form-dialog')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenCalledTimes(2); // Initial load + reload
    });
  });

  it('should render user role dropdowns', async () => {
    // Note: Testing Radix UI Select interactions requires complex portal handling.
    // We verify the role dropdowns render correctly for each user.
    render(<UserManagement />);

    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find all role dropdowns (filter + one per user)
    const roleSelects = screen.getAllByRole('combobox');
    // Should have: 1 filter dropdown + 2 user role dropdowns = 3
    expect(roleSelects.length).toBe(3);

    // Verify John's role shows Customer (his current role)
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('should open delete confirmation dialog', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    });
  });

  it('should delete user after confirmation', async () => {
    (usersApi.deleteUser as jest.Mock).mockResolvedValue(undefined);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    });

    // Confirm delete
    const confirmButton = screen.getByText('Confirm Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(usersApi.deleteUser).toHaveBeenCalledWith('user-1');
      expect(usersApi.getUsers).toHaveBeenCalledTimes(2); // Initial + reload
    });
  });

  it('should cancel delete operation', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    });

    // Cancel delete
    const cancelButton = screen.getByText('Cancel Delete');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('delete-confirm-dialog')
      ).not.toBeInTheDocument();
    });

    expect(usersApi.deleteUser).not.toHaveBeenCalled();
  });

  it('should display user count and pagination info', async () => {
    (usersApi.getUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Users (25)')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  it('should display verified/unverified badge', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      // Date should be formatted as "Jan 1, 2026"
      expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument();
      expect(screen.getByText('Jan 2, 2026')).toBeInTheDocument();
    });
  });
});
