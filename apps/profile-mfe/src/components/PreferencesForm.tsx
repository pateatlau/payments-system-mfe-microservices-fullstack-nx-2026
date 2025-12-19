/**
 * PreferencesForm Component
 *
 * Form for editing user preferences (theme, language, currency, timezone,
 * notification settings).
 *
 * Uses:
 * - React Hook Form + Zod (updatePreferencesSchema)
 * - TanStack Query hooks (usePreferences, useUpdatePreferences)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Input,
  Label,
} from '@mfe/shared-design-system';
import {
  updatePreferencesSchema,
  type UpdatePreferencesFormData,
} from '../utils/validation';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';

export interface PreferencesFormProps {
  /** Optional callback fired after a successful save. */
  onSuccess?: () => void;
}

export function PreferencesForm({ onSuccess }: PreferencesFormProps) {
  const {
    data: preferences,
    isLoading: isPreferencesLoading,
    error: preferencesError,
  } = usePreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePreferencesFormData>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: {
      theme: 'system',
      language: '',
      currency: '',
      timezone: '',
      notifications: {
        email: false,
        push: false,
        sms: false,
      },
    },
  });

  // Populate form with existing preferences when they load
  useEffect(() => {
    if (!preferences) {
      return;
    }

    reset({
      theme: preferences.theme ?? 'system',
      language: preferences.language ?? '',
      currency: preferences.currency ?? '',
      timezone: preferences.timezone ?? '',
      notifications: {
        email: preferences.notifications?.email ?? false,
        push: preferences.notifications?.push ?? false,
        sms: preferences.notifications?.sms ?? false,
      },
    });
  }, [preferences, reset]);

  const onSubmit = (data: UpdatePreferencesFormData) => {
    updatePreferencesMutation.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const isSubmitting = updatePreferencesMutation.isPending;

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
      <p className="text-sm text-slate-600">
        Configure your theme, language, currency, timezone, and notifications.
      </p>

      {/* Backend preferences load error */}
      {preferencesError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load preferences. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Update error */}
      {updatePreferencesMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update preferences. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Theme */}
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme</Label>
          <select
            id="theme"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPreferencesLoading || isSubmitting}
            {...register('theme')}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          {errors.theme && (
            <p className="text-xs text-red-600">
              {errors.theme.message as string}
            </p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            type="text"
            placeholder="e.g. en, en-US"
            disabled={isPreferencesLoading || isSubmitting}
            {...register('language')}
          />
          {errors.language && (
            <p className="text-xs text-red-600">
              {errors.language.message as string}
            </p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            type="text"
            placeholder="e.g. USD, EUR"
            disabled={isPreferencesLoading || isSubmitting}
            {...register('currency')}
          />
          {errors.currency && (
            <p className="text-xs text-red-600">
              {errors.currency.message as string}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            type="text"
            placeholder="e.g. America/New_York"
            disabled={isPreferencesLoading || isSubmitting}
            {...register('timezone')}
          />
          {errors.timezone && (
            <p className="text-xs text-red-600">
              {errors.timezone.message as string}
            </p>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-1.5">
          <Label>Notifications</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                disabled={isPreferencesLoading || isSubmitting}
                {...register('notifications.email')}
              />
              <span>Email notifications</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                disabled={isPreferencesLoading || isSubmitting}
                {...register('notifications.push')}
              />
              <span>Push notifications</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                disabled={isPreferencesLoading || isSubmitting}
                {...register('notifications.sms')}
              />
              <span>SMS notifications</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPreferencesLoading || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save preferences'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default PreferencesForm;
