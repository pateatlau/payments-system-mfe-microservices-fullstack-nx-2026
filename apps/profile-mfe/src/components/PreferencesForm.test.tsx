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

    // Select components display the selected value text in the trigger button
    // Use getAllByText since Radix renders both visible span and hidden option
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getAllByText('USD - US Dollar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('America/New_York (EST/EDT)').length).toBeGreaterThan(0);
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

    // Click the save button to submit the form
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it('displays the form header and description', () => {
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

    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Customize your application preferences and notification settings.'
      )
    ).toBeInTheDocument();
  });
});
