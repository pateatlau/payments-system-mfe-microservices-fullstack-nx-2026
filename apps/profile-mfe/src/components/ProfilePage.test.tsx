/**
 * ProfilePage Component Tests
 *
 * Verifies that the main ProfilePage entry component:
 * - Renders loading state while profile is being fetched
 * - Renders error state when the profile query fails
 * - Renders basic tab navigation and switches content when tabs are clicked
 *
 * Note: Child components (ProfileForm, PreferencesForm, AccountInfo) are
 * implemented in later tasks. For now, we only assert the placeholder
 * content used in Task 3.1.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import * as useProfileModule from '../hooks/useProfile';
import { ProfilePage } from './ProfilePage';
import type { Profile } from '../types/profile';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ProfilePage', () => {
  const mockProfile: Profile = {
    id: 'profile-1',
    userId: 'user-1',
    phone: '1234567890',
    address: '123 Test Street',
    avatarUrl: 'https://example.com/avatar.png',
    bio: 'Test bio',
    preferences: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while profile is loading', () => {
    vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    renderWithQueryClient(<ProfilePage />);

    expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
  });

  it('shows error state when profile query fails', () => {
    vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    renderWithQueryClient(<ProfilePage />);

    expect(
      screen.getByText(/Failed to load profile information/i)
    ).toBeInTheDocument();
  });

  it('renders tabs and switches content when tabs are clicked', () => {
    vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    renderWithQueryClient(<ProfilePage />);

    // Default tab is Profile
    expect(
      screen.getByText(/Profile form will be implemented/i)
    ).toBeInTheDocument();

    // Switch to Preferences tab
    fireEvent.click(screen.getByRole('button', { name: /Preferences/i }));
    expect(
      screen.getByText(/Preferences form will be implemented/i)
    ).toBeInTheDocument();

    // Switch to Account tab
    fireEvent.click(screen.getByRole('button', { name: /Account/i }));
    expect(
      screen.getByText(/Account info view will be implemented/i)
    ).toBeInTheDocument();
  });
});
