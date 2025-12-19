/**
 * Preferences Hooks
 *
 * TanStack Query hooks for user preferences data fetching and mutations.
 * Follows the same patterns as payments-mfe hooks.
 *
 * @see apps/payments-mfe/src/hooks/usePayments.ts - Reference implementation
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import { getPreferences, updatePreferences } from '../api/profile';
import type { UserPreferences, UpdatePreferencesData } from '../types/profile';

/**
 * Query key factory for preferences
 */
export const preferencesKeys = {
  all: ['preferences'] as const,
  detail: () => [...preferencesKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch current user's preferences
 *
 * Only fetches when user is authenticated.
 * Preferences are cached for 5 minutes (staleTime).
 *
 * @returns TanStack Query result with preferences data
 */
export function usePreferences() {
  const { user } = useAuthStore();

  return useQuery<UserPreferences>({
    queryKey: preferencesKeys.detail(),
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch preferences');
      }
      return await getPreferences();
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update current user's preferences
 *
 * Invalidates preferences query after successful update to refetch fresh data.
 * Preferences are merged with existing values on the backend.
 *
 * @returns TanStack Query mutation for updating preferences
 */
export function useUpdatePreferences() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<UserPreferences, Error, UpdatePreferencesData>({
    mutationFn: async (data: UpdatePreferencesData) => {
      if (!user) {
        throw new Error('User must be authenticated to update preferences');
      }
      return await updatePreferences(data);
    },
    onSuccess: updatedPreferences => {
      // Invalidate preferences query to refetch after update
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });

      // Update preferences in cache optimistically
      queryClient.setQueryData(preferencesKeys.detail(), updatedPreferences);

      // Also invalidate profile query since preferences are part of profile
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
