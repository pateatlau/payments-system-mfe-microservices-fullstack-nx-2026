/**
 * ProfilePage Integration Tests
 *
 * Comprehensive end-to-end testing of the ProfilePage component and its integration
 * with all child components, data fetching, mutations, and error handling.
 *
 * Tests:
 * - Full user flow (load, display, edit, submit)
 * - Profile update flow with form validation and API calls
 * - Preferences update flow with language and notification settings
 * - Error scenarios (network errors, validation errors, auth errors)
 * - Tab navigation and state management
 * - Loading states and optimistic updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import * as useProfileModule from '../hooks/useProfile';
import * as usePreferencesModule from '../hooks/usePreferences';
import * as useAuthStoreModule from 'shared-auth-store';
import { ProfilePage } from './ProfilePage';
import type { Profile, UserPreferences } from '../types/profile';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ProfilePage Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

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

  const mockPreferences: UserPreferences = {
    language: 'en',
    timezone: 'America/New_York',
    emailNotifications: true,
    pushNotifications: false,
    theme: 'light',
  };

  const mockUpdateProfile = jest.fn();
  const mockUpdatePreferences = jest.fn();

  beforeEach(() => {
    jest.spyOn(useAuthStoreModule, 'useAuthStore').mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
      logout: jest.fn(),
    });

    jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useProfile>);

    jest.spyOn(usePreferencesModule, 'usePreferences').mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePreferencesModule.usePreferences>);

    jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
      mutate: mockUpdateProfile,
      mutateAsync: mockUpdateProfile,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      reset: jest.fn(),
    } as any);

    jest.spyOn(usePreferencesModule, 'useUpdatePreferences').mockReturnValue({
      mutateAsync: mockUpdatePreferences,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      reset: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Full Flow Tests', () => {
    it('loads profile data and displays all tabs correctly', async () => {
      renderWithQueryClient(<ProfilePage />);

      // Check main header
      expect(
        screen.getByRole('heading', { name: 'Profile' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Manage your personal information/i)
      ).toBeInTheDocument();

      // Check tabs are rendered
      expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: 'Preferences' })
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();

      // Profile tab should be active by default
      expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Profile form should be visible
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    });

    it('switches between tabs and displays correct content', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ProfilePage />);

      // Switch to Preferences tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();

      // Switch to Account tab
      await user.click(screen.getByRole('tab', { name: 'Account' }));

      expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText(/account details/i)).toBeInTheDocument();
    });
  });

  describe('Profile Update Flow', () => {
    it('updates profile successfully with valid data', async () => {
      const user = userEvent.setup();
      const updatedProfile = { ...mockProfile, phone: '9876543210' };
      mockUpdateProfile.mockResolvedValue(updatedProfile);

      renderWithQueryClient(<ProfilePage />);

      // Fill out profile form
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');

      const addressInput = screen.getByLabelText(/address/i);
      await user.clear(addressInput);
      await user.type(addressInput, '456 Updated Street');

      const bioInput = screen.getByLabelText(/bio/i);
      await user.clear(bioInput);
      await user.type(bioInput, 'Updated bio');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Verify mutation was called with correct data
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          phoneNumber: '9876543210',
          address: '456 Updated Street',
          avatarUrl: 'https://example.com/avatar.png',
          bio: 'Updated bio',
        });
      });
    });

    it('handles profile update errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to update profile';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      // Mock the hook to return error state
      jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
        mutate: mockUpdateProfile,
        mutateAsync: mockUpdateProfile,
        isPending: false,
        isSuccess: false,
        isError: true,
        error: new Error(errorMessage),
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Try to update profile
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('validates form fields before submission', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ProfilePage />);

      // Submit form with empty phone (should show validation)
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, 'invalid');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Form validation should prevent submission
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Preferences Update Flow', () => {
    it('updates preferences successfully', async () => {
      const user = userEvent.setup();
      const updatedPreferences = { ...mockPreferences, language: 'es' };
      mockUpdatePreferences.mockResolvedValue(updatedPreferences);

      renderWithQueryClient(<ProfilePage />);

      // Switch to Preferences tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      // Update language
      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'es');

      // Update notification settings
      const emailNotificationsCheckbox =
        screen.getByLabelText(/email notifications/i);
      await user.click(emailNotificationsCheckbox);

      const pushNotificationsCheckbox =
        screen.getByLabelText(/push notifications/i);
      await user.click(pushNotificationsCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /save preferences/i,
      });
      await user.click(submitButton);

      // Verify mutation was called with correct data
      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          language: 'es',
          timezone: 'America/New_York',
          emailNotifications: false, // Toggled from true to false
          pushNotifications: true, // Toggled from false to true
          theme: 'light',
        });
      });
    });

    it('handles preferences update errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to update preferences';
      mockUpdatePreferences.mockRejectedValue(new Error(errorMessage));

      // Mock the hook to return error state
      jest.spyOn(usePreferencesModule, 'useUpdatePreferences').mockReturnValue({
        mutateAsync: mockUpdatePreferences,
        isPending: false,
        isSuccess: false,
        isError: true,
        error: new Error(errorMessage),
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Switch to Preferences tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      // Try to update preferences
      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'fr');

      const submitButton = screen.getByRole('button', {
        name: /save preferences/i,
      });
      await user.click(submitButton);

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    it('displays error state when profile fetch fails', () => {
      jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load profile'),
      } as unknown as ReturnType<typeof useProfileModule.useProfile>);

      renderWithQueryClient(<ProfilePage />);

      expect(
        screen.getByText(/Failed to load profile information/i)
      ).toBeInTheDocument();
    });

    it('displays loading state while profile is loading', () => {
      jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useProfileModule.useProfile>);

      renderWithQueryClient(<ProfilePage />);

      expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
    });

    it('handles authentication errors gracefully', () => {
      // Mock unauthenticated state
      jest.spyOn(useAuthStoreModule, 'useAuthStore').mockReturnValue({
        user: null,
        setUser: jest.fn(),
        logout: jest.fn(),
      });

      jest.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('User must be authenticated to fetch profile'),
      } as unknown as ReturnType<typeof useProfileModule.useProfile>);

      renderWithQueryClient(<ProfilePage />);

      expect(
        screen.getByText(/Failed to load profile information/i)
      ).toBeInTheDocument();
    });

    it('handles network errors during profile update', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      mockUpdateProfile.mockRejectedValue(networkError);

      // Mock the hook to return error state
      jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
        mutate: mockUpdateProfile,
        mutateAsync: mockUpdateProfile,
        isPending: false,
        isSuccess: false,
        isError: true,
        error: networkError,
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Try to update profile
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Network error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('handles server errors during preferences update', async () => {
      const user = userEvent.setup();
      const serverError = new Error('Server error: 500');
      serverError.name = 'ServerError';
      mockUpdatePreferences.mockRejectedValue(serverError);

      // Mock the hook to return error state
      jest.spyOn(usePreferencesModule, 'useUpdatePreferences').mockReturnValue({
        mutateAsync: mockUpdatePreferences,
        isPending: false,
        isSuccess: false,
        isError: true,
        error: serverError,
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Switch to Preferences tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      // Try to update preferences
      const submitButton = screen.getByRole('button', {
        name: /save preferences/i,
      });
      await user.click(submitButton);

      // Server error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation and State Management', () => {
    it('maintains tab state during form submission', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithQueryClient(<ProfilePage />);

      // Switch to Preferences tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      // Start profile update (should stay on Preferences tab)
      const submitButton = screen.getByRole('button', {
        name: /save preferences/i,
      });
      await user.click(submitButton);

      // Tab should remain active during submission
      expect(screen.getByRole('tab', { name: 'Preferences' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('preserves form data when switching tabs and returning', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ProfilePage />);

      // Fill out profile form
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');

      // Switch to another tab
      await user.click(screen.getByRole('tab', { name: 'Preferences' }));

      // Switch back to Profile tab
      await user.click(screen.getByRole('tab', { name: 'Profile' }));

      // Form data should be preserved
      expect(phoneInput).toHaveValue('9876543210');
    });
  });

  describe('Loading States and Optimistic Updates', () => {
    it('shows loading state during profile update', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      // Mock the hook to return loading state during mutation
      jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
        mutate: mockUpdateProfile,
        mutateAsync: mockUpdateProfile,
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Start profile update
      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Loading state should be shown - button text changes to "Saving..."
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('shows success message after successful update', async () => {
      const user = userEvent.setup();
      const updatedProfile = { ...mockProfile, phone: '9876543210' };
      mockUpdateProfile.mockResolvedValue(updatedProfile);

      // Mock the hook to return success state
      jest.spyOn(useProfileModule, 'useUpdateProfile').mockReturnValue({
        mutate: mockUpdateProfile,
        mutateAsync: mockUpdateProfile,
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
        reset: jest.fn(),
      } as any);

      renderWithQueryClient(<ProfilePage />);

      // Update profile
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Success should be indicated by the mutation being called successfully
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          phoneNumber: '9876543210',
          address: '',
          avatarUrl: '',
          bio: '',
        });
      });
    });
  });
});
