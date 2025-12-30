/**
 * User Management Component
 *
 * Displays list of users with search, filter, pagination, and CRUD operations
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
  Loading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mfe/shared-design-system';
import { UserRole } from 'shared-types';
import {
  getUsers,
  updateUserRole,
  deleteUser,
  type User,
  type UserFilters,
} from '../api/users';
import { UserFormDialog } from './UserFormDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

/**
 * User Management Component
 */
export function UserManagement() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    role: undefined,
    search: '',
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  /**
   * Load users from API
   */
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getUsers(filters);
      setUsers(response.users || []);
      setPagination(response.pagination);
    } catch (err) {
      console.error('[UserManagement] Failed to load users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]); // Ensure users is always an array
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load users when filters change
   */
  useEffect(() => {
    loadUsers();
  }, [filters]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  /**
   * Handle role filter change
   */
  const handleRoleFilterChange = (role: UserRole | 'ALL') => {
    setFilters(prev => ({
      ...prev,
      role: role === 'ALL' ? undefined : role,
      page: 1,
    }));
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  /**
   * Handle create user
   */
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  /**
   * Handle edit user
   */
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  /**
   * Handle user form submit
   */
  const handleUserFormSubmit = async () => {
    setIsFormOpen(false);
    await loadUsers();
  };

  /**
   * Handle role change
   */
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update user role'
      );
    }
  };

  /**
   * Handle delete user
   */
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Confirm delete user
   */
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <span className="mr-2">+</span>
          Create User
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                value={filters.search || ''}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select
                value={filters.role || 'ALL'}
                onValueChange={value =>
                  handleRoleFilterChange(value as UserRole | 'ALL')
                }
              >
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                  <SelectItem value={UserRole.VENDOR}>Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>
            Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Select
                          value={user.role}
                          onValueChange={value =>
                            handleRoleChange(user.id, value as UserRole)
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                            <SelectItem value={UserRole.VENDOR}>Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant={user.emailVerified ? 'success' : 'secondary'}
                        >
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      {isFormOpen && (
        <UserFormDialog
          user={selectedUser}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleUserFormSubmit}
        />
      )}

      {/* Delete Confirm Dialog */}
      {isDeleteDialogOpen && userToDelete && (
        <DeleteConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete "${userToDelete.name}"? This action cannot be undone.`}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

export default UserManagement;
