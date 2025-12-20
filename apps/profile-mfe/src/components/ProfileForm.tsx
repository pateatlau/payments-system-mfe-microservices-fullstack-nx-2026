/**
 * ProfileForm Component
 *
 * Form for editing profile information (phone, address, bio, avatar).
 *
 * Uses:
 * - React Hook Form + Zod for validation
 * - TanStack Query mutation hook (useUpdateProfile)
 * - AvatarUpload for avatar selection/preview
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
    } catch (error) {
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
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-24 ml-auto" />
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
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-600">
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
            <p className="text-xs text-red-600">
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
            <p className="text-xs text-red-600">
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
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us about yourself..."
            disabled={isSubmitting}
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-red-600">
              {errors.bio.message as string}
            </p>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="shrink-0">
              <AvatarUpload
                initialUrl={watch('avatarUrl') || undefined}
                onFileChange={(file: File | null) => {
                  // For now we only set avatarUrl to empty string or
                  // keep existing URL; upload flow will be wired in later.
                  if (!file) {
                    setValue('avatarUrl', '');
                    return;
                  }

                  // Create a preview URL for the selected file
                  const previewUrl = URL.createObjectURL(file);
                  setValue('avatarUrl', previewUrl);
                }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                Profile Photo
              </p>
              <p className="text-sm text-slate-500">
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
