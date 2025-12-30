/**
 * ProfileForm Component
 *
 * A comprehensive form component for editing user profile information.
 * Handles phone number, address, bio, and avatar updates with full validation
 * and error handling.
 *
 * @component
 * @example
 * ```tsx
 * <ProfileForm />
 * ```
 *
 * Features:
 * - Real-time form validation using Zod schemas
 * - Optimistic UI updates with TanStack Query
 * - Avatar upload with preview functionality
 * - Toast notifications for success/error feedback
 * - Loading states during form submission
 * - Form pre-population from existing profile data
 *
 * @uses React Hook Form for form state management
 * @uses Zod for runtime validation
 * @uses TanStack Query for data mutations
 * @uses AvatarUpload component for avatar management
 * @uses Toast system for user feedback
 *
 * @returns {JSX.Element} The profile form component
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Input,
  Label,
  Skeleton,
  Toast,
  ToastContainer,
} from '@mfe/shared-design-system';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../utils/validation';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { AvatarUpload } from './AvatarUpload';
import { useToast } from '../hooks/useToast';

export interface ProfileFormProps {
  /** Optional callback fired after a successful save. */
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const { toasts, dismissToast, showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      phoneNumber: '',
      address: '',
      avatarUrl: '',
      bio: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setIsSubmitting(true);
      await updateProfileMutation.mutateAsync(data);
      showSuccess('Profile updated successfully!', 'Success');
      onSuccess?.();
    } catch {
      showError('Failed to update profile. Please try again.', 'Update Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate form with existing profile data when it loads
  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      phoneNumber: profile.phone ?? '',
      address: profile.address ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      bio: profile.bio ?? '',
    });
  }, [profile, reset]);

  // Show loading skeleton while profile is loading
  if (isProfileLoading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-64 h-4" />
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-4" />
            </div>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-full h-10" />
            </div>
          ))}
          <Skeleton className="w-24 h-10 ml-auto" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <ToastContainer position="bottom-right">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Update your contact information and profile details.
        </p>
      </div>

      {/* Backend profile load error */}
      {profileError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Update error */}
      {updateProfileMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update profile. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 000-0000"
            disabled={isSubmitting}
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive">
              {errors.phoneNumber.message as string}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="123 Main St, Anytown, USA"
            disabled={isSubmitting}
            {...register('address')}
          />
          {errors.address && (
            <p className="text-xs text-destructive">
              {errors.address.message as string}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={4}
            className="flex w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us about yourself..."
            disabled={isSubmitting}
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">
              {errors.bio.message as string}
            </p>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <AvatarUpload
                initialUrl={watch('avatarUrl') || undefined}
                onFileChange={(file: File | null) => {
                  // TODO: Replace base64 storage with proper file upload to cloud storage (S3)
                  // before production deployment. Base64 is a temporary workaround that:
                  // - Increases database storage size significantly
                  // - Slows down API responses with large payloads
                  // - Should be replaced with: upload to S3/cloud -> store permanent URL
                  if (!file) {
                    setValue('avatarUrl', '');
                    return;
                  }

                  // Convert file to base64 data URL for persistence
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setValue('avatarUrl', base64String);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Profile Photo
              </p>
              <p className="text-sm text-muted-foreground">
                Recommended size: 200x200px. Max 2MB.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default ProfileForm;
