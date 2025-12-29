/**
 * PreferencesForm Component Tests
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as preferencesHooks from '../hooks/usePreferences';
import { PreferencesForm } from './PreferencesForm';
import type { UserPreferences } from '../types/profile';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('PreferencesForm', () => {
  const basePrefs: UserPreferences = {
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders existing preferences in the form', () => {
    jest.spyOn(preferencesHooks, 'usePreferences').mockReturnValue({
      data: basePrefs,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.usePreferences>);

    jest.spyOn(preferencesHooks, 'useUpdatePreferences').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.useUpdatePreferences>);

    renderWithQueryClient(<PreferencesForm />);

    expect(screen.getByLabelText(/language/i)).toHaveValue(basePrefs.language);
    expect(screen.getByLabelText(/currency/i)).toHaveValue(basePrefs.currency);
    expect(screen.getByLabelText(/timezone/i)).toHaveValue(basePrefs.timezone);
  });

  it('submits updated preferences via useUpdatePreferences', async () => {
    jest.spyOn(preferencesHooks, 'usePreferences').mockReturnValue({
      data: basePrefs,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.usePreferences>);

    const mutateAsyncMock = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(preferencesHooks, 'useUpdatePreferences').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: mutateAsyncMock,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.useUpdatePreferences>);

    renderWithQueryClient(<PreferencesForm />);

    const timezoneInput = screen.getByLabelText(/timezone/i);
    fireEvent.change(timezoneInput, {
      target: { value: 'Europe/Berlin' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it('shows validation error when language is invalid', async () => {
    jest.spyOn(preferencesHooks, 'usePreferences').mockReturnValue({
      data: basePrefs,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.usePreferences>);

    jest.spyOn(preferencesHooks, 'useUpdatePreferences').mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof preferencesHooks.useUpdatePreferences>);

    renderWithQueryClient(<PreferencesForm />);

    const languageInput = screen.getByLabelText(/language/i);
    fireEvent.change(languageInput, { target: { value: 'x' } });

    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/language code must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });
});
