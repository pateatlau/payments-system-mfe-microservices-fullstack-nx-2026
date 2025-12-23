/**
 * AccountInfo Component
 *
 * Read-only view of authenticated account details.
 *
 * Displays:
 * - User ID
 * - Email
 * - Role
 * - Account created date
 * - Last updated date
 * - Email verification status
 */

import { useMemo } from 'react';
import { Card, Badge } from '@mfe/shared-design-system';
import { useAuthStore } from 'shared-auth-store';

function formatDate(value: string | undefined | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function AccountInfo() {
  const { user } = useAuthStore();

  const account = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }, [user]);

  if (!account) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Account information is available after you sign in.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="text-sm text-muted-foreground">
            Read-only overview of your account details.
          </p>
        </div>
        <Badge variant={account.emailVerified ? 'success' : 'secondary'}>
          {account.emailVerified ? 'Email verified' : 'Email not verified'}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="font-medium text-foreground">User ID</dt>
          <dd className="text-foreground break-all">{account.id}</dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">Email</dt>
          <dd className="text-foreground">{account.email}</dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">Name</dt>
          <dd className="text-foreground">{account.name}</dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">Role</dt>
          <dd className="text-foreground">{account.role}</dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">Account created</dt>
          <dd className="text-foreground">{formatDate(account.createdAt)}</dd>
        </div>

        <div>
          <dt className="font-medium text-muted-foreground">Last updated</dt>
          <dd className="text-foreground">{formatDate(account.updatedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}

export default AccountInfo;
