/**
 * AccountInfo Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountInfo } from './AccountInfo';
import { useAuthStore } from 'shared-auth-store';

vi.mock('shared-auth-store', () => {
  const actual = vi.requireActual('shared-auth-store');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

describe('AccountInfo', () => {
  it('renders fallback message when no user is authenticated', () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({ user: null });

    render(<AccountInfo />);

    expect(
      screen.getByText(/available after you sign in/i)
    ).toBeInTheDocument();
  });

  it('renders account details when user is present', () => {
    (useAuthStore as unknown as vi.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T10:00:00.000Z',
      },
    });

    render(<AccountInfo />);

    expect(screen.getByText(/user-1/)).toBeInTheDocument();
    expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/CUSTOMER/)).toBeInTheDocument();
    expect(screen.getByText(/Email verified/i)).toBeInTheDocument();
  });
});
