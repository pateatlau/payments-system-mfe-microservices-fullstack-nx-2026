/**
 * ProfilePage Component Tests
 *
 * Verifies that the main ProfilePage entry component:
 * - Renders loading state while profile is being fetched
 * - Renders error state when the profile query fails
 * - Renders basic tab navigation and switches content when tabs are clicked
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import * as useProfileModule from '../hooks/useProfile';
import * as usePreferencesModule from '../hooks/usePreferences';
import { ProfilePage } from './ProfilePage';
import type { Profile, UserPreferences } from '../types/profile';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

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
    jest.restoreAllMocks();
  });

  it('shows loading state while profile is loading', () => {
    jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    renderWithQueryClient(<ProfilePage />);

    expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
  });

  it('shows error state when profile query fails', () => {
    jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
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
    const mockPreferences: UserPreferences = {
      theme: 'dark',
      language: 'en',
      currency: 'USD',
      timezone: 'America/New_York',
      notifications: {
        email: true,
        push: false,
        sms: true,
      },
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
      isAuthenticated: true,
    });

    jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>);

    jest.spyOn(usePreferencesModule, 'usePreferences').mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePreferencesModule.usePreferences>);

    jest.spyOn(usePreferencesModule, 'useUpdatePreferences').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof usePreferencesModule.useUpdatePreferences>);

    renderWithQueryClient(<ProfilePage />);

    // Default tab is Profile - form should be visible
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

    // Switch to Preferences tab
    fireEvent.click(screen.getByRole('button', { name: /Preferences/i }));
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();

    // Switch to Account tab
    fireEvent.click(screen.getByRole('button', { name: /Account/i }));
    expect(
      screen.getByText(/read-only overview of your account details/i)
    ).toBeInTheDocument();
  });
});
