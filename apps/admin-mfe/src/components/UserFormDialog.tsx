/**
 * User Form Dialog Component
 *
 * Modal dialog for creating or editing users
 */

import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  Select,
} from '@mfe/shared-design-system';
import { UserRole } from 'shared-types';
import { createUser, updateUser, type User } from '../api/users';

/**
 * Form data interface
 */
interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Validation errors interface
 */
interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Props for UserFormDialog
 */
export interface UserFormDialogProps {
  /**
   * User to edit (null for create mode)
   */
  user: User | null;

  /**
   * Called when dialog is closed
   */
  onClose: () => void;

  /**
   * Called when form is successfully submitted
   */
  onSubmit: () => void;
}

/**
 * User Form Dialog Component
 */
export function UserFormDialog({
  user,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const isEditMode = user !== null;

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || UserRole.CUSTOMER,
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (only for create mode)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 12) {
        newErrors.password = 'Password must be at least 12 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password =
          'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
        newErrors.password =
          'Password must contain at least one special character';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (isEditMode) {
        // Update user
        await updateUser(user.id, {
          name: formData.name,
          email: formData.email,
        });
      } else {
        // Create user
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }

      onSubmit();
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'create'} user`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (
    field: keyof UserFormData,
    value: string | UserRole
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 rounded-lg shadow-xl bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditMode
              ? 'Update user information'
              : 'Add a new user to the system'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* API Error */}
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password (only in create mode) */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  placeholder="Minimum 12 characters"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be 12+ characters with uppercase, lowercase, numbers, and
                  symbols
                </p>
              </div>
            )}

            {/* Role (only in create mode) */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="role"
                  value={formData.role}
                  onChange={e =>
                    handleInputChange('role', e.target.value as UserRole)
                  }
                >
                  <option value={UserRole.CUSTOMER}>Customer</option>
                  <option value={UserRole.VENDOR}>Vendor</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Role can be changed later from the user list
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 space-x-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : isEditMode
                ? 'Update User'
                : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserFormDialog;
