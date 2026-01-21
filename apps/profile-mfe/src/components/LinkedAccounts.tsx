/**
 * LinkedAccounts Component
 *
 * Displays and manages OAuth accounts linked to the user's profile.
 * Allows users to link new social accounts and unlink existing ones.
 *
 * @component
 */

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Alert,
  AlertDescription,
} from '@mfe/shared-design-system';
import {
  useLinkedAccounts,
  useSupportedProviders,
  useUnlinkAccount,
  useLinkAccount,
  OAuthAccount,
} from '../hooks/useOAuthAccounts';

// Provider display configuration
const providerConfig: Record<
  string,
  { name: string; icon: JSX.Element; colors: string }
> = {
  google: {
    name: 'Google',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    colors: 'border-gray-200 hover:bg-gray-50',
  },
  github: {
    name: 'GitHub',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    colors: 'border-gray-800 bg-gray-900 text-white hover:bg-gray-800',
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    colors: 'border-[#1877F2] hover:bg-blue-50',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (
      <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    colors: 'border-[#0A66C2] hover:bg-blue-50',
  },
  twitter: {
    name: 'X',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    colors: 'border-black hover:bg-gray-50',
  },
};

// Confirmation dialog state
interface UnlinkConfirmState {
  isOpen: boolean;
  provider: string | null;
  providerName: string | null;
}

export function LinkedAccounts() {
  const [unlinkConfirm, setUnlinkConfirm] = useState<UnlinkConfirmState>({
    isOpen: false,
    provider: null,
    providerName: null,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Queries
  const {
    data: linkedAccounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useLinkedAccounts();
  const {
    data: supportedProviders,
    isLoading: providersLoading,
    error: providersError,
  } = useSupportedProviders();

  // Mutations
  const unlinkMutation = useUnlinkAccount();
  const { initiateLink } = useLinkAccount();

  // Determine which providers are available for linking
  const linkedProviderIds = linkedAccounts?.map((a) => a.provider) || [];
  const availableProviders =
    supportedProviders?.filter((p) => !linkedProviderIds.includes(p)) || [];

  // Check if user can unlink (must have password or multiple OAuth accounts)
  // For now, we'll let the backend handle this validation
  const canUnlink = (linkedAccounts?.length || 0) > 1;

  // Handlers
  const handleLink = (provider: string) => {
    setSuccessMessage(null);
    initiateLink(provider);
  };

  const handleUnlinkClick = (account: OAuthAccount) => {
    const config = providerConfig[account.provider];
    setUnlinkConfirm({
      isOpen: true,
      provider: account.provider,
      providerName: config?.name || account.provider,
    });
  };

  const handleUnlinkConfirm = async () => {
    if (!unlinkConfirm.provider) return;

    try {
      await unlinkMutation.mutateAsync(unlinkConfirm.provider);
      setSuccessMessage(
        `${unlinkConfirm.providerName} account unlinked successfully.`
      );
      setUnlinkConfirm({ isOpen: false, provider: null, providerName: null });
    } catch {
      // Error handled by mutation
    }
  };

  const handleUnlinkCancel = () => {
    setUnlinkConfirm({ isOpen: false, provider: null, providerName: null });
  };

  // Loading state
  if (accountsLoading || providersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading linked accounts...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (accountsError || providersError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load linked accounts. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>
          Connect your social accounts for quick sign-in. You can link multiple
          accounts to your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success message */}
        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Unlink error */}
        {unlinkMutation.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {unlinkMutation.error instanceof Error
                ? unlinkMutation.error.message
                : 'Failed to unlink account. You must have at least one login method.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Unlink confirmation dialog */}
        {unlinkConfirm.isOpen && (
          <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20">
            <h4 className="font-medium text-destructive mb-2">
              Unlink {unlinkConfirm.providerName}?
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              You will no longer be able to sign in using this{' '}
              {unlinkConfirm.providerName} account. This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnlinkConfirm}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? 'Unlinking...' : 'Unlink Account'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkCancel}
                disabled={unlinkMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Linked accounts list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Connected Accounts
          </h4>
          {linkedAccounts && linkedAccounts.length > 0 ? (
            <div className="space-y-2">
              {linkedAccounts.map((account) => {
                const config = providerConfig[account.provider] || {
                  name: account.provider,
                  icon: null,
                  colors: 'border-gray-200',
                };

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">{config.icon}</div>
                      <div>
                        <p className="font-medium">{config.name}</p>
                        {account.email && (
                          <p className="text-sm text-muted-foreground">
                            {account.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Linked{' '}
                        {new Date(account.linkedAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkClick(account)}
                        disabled={
                          unlinkMutation.isPending ||
                          unlinkConfirm.isOpen ||
                          (!canUnlink && linkedAccounts.length === 1)
                        }
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              No social accounts linked yet.
            </p>
          )}
        </div>

        {/* Available providers to link */}
        {availableProviders.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Add Another Account
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableProviders.map((provider) => {
                const config = providerConfig[provider] || {
                  name: provider,
                  icon: null,
                  colors: 'border-gray-200 hover:bg-gray-50',
                };

                return (
                  <Button
                    key={provider}
                    variant="outline"
                    className={`flex items-center gap-2 ${config.colors}`}
                    onClick={() => handleLink(provider)}
                  >
                    {config.icon}
                    <span>{config.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info about login methods */}
        {linkedAccounts && linkedAccounts.length === 1 && (
          <Alert>
            <AlertDescription>
              You have one linked account. To unlink it, you need to either set
              a password or link another social account first.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default LinkedAccounts;
