/**
 * MFA React Query Hooks
 *
 * Custom hooks for MFA operations using TanStack Query.
 * Provides data fetching, caching, and mutation handling.
 *
 * @module useMfa
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMfaStatus,
  setupMfa,
  verifyMfaSetup,
  disableMfa,
  regenerateBackupCodes,
} from '../api/mfa';

/**
 * Query keys for MFA-related queries
 */
export const mfaKeys = {
  all: ['mfa'] as const,
  status: () => [...mfaKeys.all, 'status'] as const,
};

/**
 * Hook to fetch MFA status for current user
 *
 * @returns TanStack Query result with MFA status data
 */
export function useMfaStatus() {
  return useQuery({
    queryKey: mfaKeys.status(),
    queryFn: getMfaStatus,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to setup MFA (generate QR code and backup codes)
 *
 * @returns TanStack Mutation for MFA setup
 */
export function useSetupMfa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setupMfa,
    onSuccess: () => {
      // Invalidate status to reflect pending setup
      queryClient.invalidateQueries({ queryKey: mfaKeys.status() });
    },
  });
}

/**
 * Hook to verify MFA setup with TOTP code
 *
 * @returns TanStack Mutation for MFA verification
 */
export function useVerifyMfaSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (totpCode: string) => verifyMfaSetup(totpCode),
    onSuccess: () => {
      // Invalidate status to show MFA is now enabled
      queryClient.invalidateQueries({ queryKey: mfaKeys.status() });
    },
  });
}

/**
 * Hook to disable MFA
 *
 * @returns TanStack Mutation for disabling MFA
 */
export function useDisableMfa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ password, totpCode }: { password: string; totpCode: string }) =>
      disableMfa(password, totpCode),
    onSuccess: () => {
      // Invalidate status to show MFA is now disabled
      queryClient.invalidateQueries({ queryKey: mfaKeys.status() });
    },
  });
}

/**
 * Hook to regenerate backup codes
 *
 * @returns TanStack Mutation for regenerating backup codes
 */
export function useRegenerateBackupCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (totpCode: string) => regenerateBackupCodes(totpCode),
    onSuccess: () => {
      // Invalidate status to update backup codes count
      queryClient.invalidateQueries({ queryKey: mfaKeys.status() });
    },
  });
}
