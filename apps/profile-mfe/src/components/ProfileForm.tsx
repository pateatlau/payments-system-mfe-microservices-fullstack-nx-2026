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

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Input,
  Label,
} from '@mfe/shared-design-system';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../utils/validation';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { AvatarUpload } from './AvatarUpload';

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

  const {
    register,
    handleSubmit,
    setValue,
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

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const isSubmitting = updateProfileMutation.isPending;

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
      <p className="text-sm text-slate-600">
        Update your contact information and profile details.
      </p>

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
            placeholder="Enter phone number"
            disabled={isProfileLoading || isSubmitting}
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
            type="text"
            placeholder="Enter address"
            disabled={isProfileLoading || isSubmitting}
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
            className="w-full min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us a bit about yourself (max 1000 characters)"
            disabled={isProfileLoading || isSubmitting}
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-red-600">
              {errors.bio.message as string}
            </p>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <AvatarUpload
            initialUrl={profile?.avatarUrl ?? null}
            onFileChange={file => {
              // For now we only set avatarUrl to empty string or
              // keep existing URL; upload flow will be wired in later.
              if (!file) {
                setValue('avatarUrl', '');
                return;
              }

              // Indicate that a new image was chosen; integration with
              // actual upload endpoint will be added in avatar tasks.
              setValue('avatarUrl', '');
            }}
          />
          {errors.avatarUrl && (
            <p className="text-xs text-red-600">
              {errors.avatarUrl.message as string}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isProfileLoading || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ProfileForm;
