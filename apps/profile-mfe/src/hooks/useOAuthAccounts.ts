/**
 * OAuth Accounts React Query Hooks
 *
 * Custom hooks for OAuth account operations using TanStack Query.
 * Provides data fetching, caching, and mutation handling.
 *
 * @module useOAuthAccounts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLinkedAccounts,
  getSupportedProviders,
  unlinkAccount,
  getLinkAccountUrl,
  OAuthAccount,
} from '../api/oauth';

/**
 * Query keys for OAuth-related queries
 */
export const oauthKeys = {
  all: ['oauth'] as const,
  accounts: () => [...oauthKeys.all, 'accounts'] as const,
  providers: () => [...oauthKeys.all, 'providers'] as const,
};

/**
 * Hook to fetch linked OAuth accounts for current user
 *
 * @returns TanStack Query result with linked accounts data
 */
export function useLinkedAccounts() {
  return useQuery({
    queryKey: oauthKeys.accounts(),
    queryFn: getLinkedAccounts,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to fetch supported OAuth providers
 *
 * @returns TanStack Query result with supported providers
 */
export function useSupportedProviders() {
  return useQuery({
    queryKey: oauthKeys.providers(),
    queryFn: getSupportedProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes (providers rarely change)
    retry: 1,
  });
}

/**
 * Hook to unlink an OAuth account
 *
 * @returns TanStack Mutation for unlinking OAuth account
 */
export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => unlinkAccount(provider),
    onSuccess: () => {
      // Invalidate accounts list to refresh
      queryClient.invalidateQueries({ queryKey: oauthKeys.accounts() });
    },
  });
}

/**
 * Hook to initiate OAuth account linking
 * This returns a function that redirects to the OAuth flow
 *
 * @returns Function to initiate linking for a provider
 */
export function useLinkAccount() {
  const initiateLink = (provider: string) => {
    const url = getLinkAccountUrl(provider);
    // Redirect to backend OAuth endpoint
    window.location.href = url;
  };

  return { initiateLink };
}

// Re-export types
export type { OAuthAccount };
