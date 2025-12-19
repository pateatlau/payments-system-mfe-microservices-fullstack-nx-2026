/**
 * Profile Hooks
 *
 * TanStack Query hooks for profile data fetching and mutations.
 * Follows the same patterns as payments-mfe hooks.
 *
 * @see apps/payments-mfe/src/hooks/usePayments.ts - Reference implementation
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import { getProfile, updateProfile } from '../api/profile';
import type { Profile, UpdateProfileData } from '../types/profile';

/**
 * Query key factory for profile
 */
export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch current user's profile
 *
 * Only fetches when user is authenticated.
 * Profile is cached for 5 minutes (staleTime).
 *
 * @returns TanStack Query result with profile data
 */
export function useProfile() {
  const { user } = useAuthStore();

  return useQuery<Profile>({
    queryKey: profileKeys.detail(),
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch profile');
      }
      return await getProfile();
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update current user's profile
 *
 * Invalidates profile query after successful update to refetch fresh data.
 *
 * @returns TanStack Query mutation for updating profile
 */
export function useUpdateProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, UpdateProfileData>({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user) {
        throw new Error('User must be authenticated to update profile');
      }
      // Convert empty strings to undefined before sending to API
      const cleanedData: UpdateProfileData = {
        phoneNumber: data.phoneNumber === '' ? undefined : data.phoneNumber,
        address: data.address === '' ? undefined : data.address,
        avatarUrl: data.avatarUrl === '' ? undefined : data.avatarUrl,
        bio: data.bio === '' ? undefined : data.bio,
      };
      return await updateProfile(cleanedData);
    },
    onSuccess: updatedProfile => {
      // Invalidate profile query to refetch after update
      queryClient.invalidateQueries({ queryKey: profileKeys.all });

      // Update profile in cache optimistically
      queryClient.setQueryData(profileKeys.detail(), updatedProfile);
    },
  });
}
