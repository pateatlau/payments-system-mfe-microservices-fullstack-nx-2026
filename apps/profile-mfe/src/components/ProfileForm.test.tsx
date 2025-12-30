/**
 * ProfileForm Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as useProfileHooks from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';
import type { Profile } from '../types/profile';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ProfileForm', () => {
  const baseProfile: Profile = {
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

  it('renders existing profile data in the form', async () => {
    jest.spyOn(useProfileHooks, 'useProfile').mockReturnValue({
      data: baseProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useProfile>);

    jest.spyOn(useProfileHooks, 'useUpdateProfile').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useUpdateProfile>);

    renderWithQueryClient(<ProfileForm />);

    expect(
      screen.getByLabelText(/phone number/i) as HTMLInputElement
    ).toHaveValue(baseProfile.phone);
    expect(screen.getByLabelText(/address/i)).toHaveValue(baseProfile.address);
    expect(screen.getByLabelText(/bio/i)).toHaveValue(baseProfile.bio);
  });

  it('submits updated data via useUpdateProfile', async () => {
    jest.spyOn(useProfileHooks, 'useProfile').mockReturnValue({
      data: baseProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useProfile>);

    const mutateAsyncMock = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(useProfileHooks, 'useUpdateProfile').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: mutateAsyncMock,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useUpdateProfile>);

    renderWithQueryClient(<ProfileForm />);

    const phoneInput = screen.getByLabelText(
      /phone number/i
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '0987654321' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it('displays validation errors when form is invalid', async () => {
    jest.spyOn(useProfileHooks, 'useProfile').mockReturnValue({
      data: baseProfile,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useProfile>);

    jest.spyOn(useProfileHooks, 'useUpdateProfile').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileHooks.useUpdateProfile>);

    renderWithQueryClient(<ProfileForm />);

    const phoneInput = screen.getByLabelText(
      /phone number/i
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/phone number must be at least 10 characters/i)
      ).toBeInTheDocument();
    });
  });
});
