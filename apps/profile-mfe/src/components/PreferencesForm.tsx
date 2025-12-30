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

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Input,
  Label,
  Select,
  Skeleton,
  Toast,
  ToastContainer,
} from '@mfe/shared-design-system';
import {
  updatePreferencesSchema,
  type UpdatePreferencesFormData,
} from '../utils/validation';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { useToast } from '../hooks/useToast';

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
  const { toasts, dismissToast, showSuccess, showError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Show loading skeleton while preferences are loading
  const isLoading = isPreferencesLoading || !preferences;

  // Populate form with existing preferences when they load
  useEffect(() => {
    if (preferences) {
      reset({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        currency: preferences.currency,
        notifications: {
          email: preferences.notifications?.email || false,
          push: preferences.notifications?.push || false,
          sms: preferences.notifications?.sms || false,
        },
      });
    }
  }, [preferences, reset]);

  const onSubmit = async (data: UpdatePreferencesFormData) => {
    try {
      setIsSubmitting(true);
      await updatePreferencesMutation.mutateAsync(data);
      showSuccess('Preferences updated successfully!', 'Success');
      onSuccess?.();
    } catch (_error) {
      showError(
        'Failed to update preferences. Please try again.',
        'Update Failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton if data is loading
  if (isLoading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-10 w-24 ml-auto" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <ToastContainer position="bottom-right">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize your application preferences and notification settings.
        </p>
      </div>

      {/* Backend preferences load error */}
      {preferencesError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load preferences. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {updatePreferencesMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update preferences. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Theme */}
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme</Label>
          <Select
            id="theme"
            disabled={isPreferencesLoading || isSubmitting}
            {...register('theme')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="notifications-email"
                  className="text-sm font-medium"
                >
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                id="notifications-email"
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-ring"
                disabled={isSubmitting}
                {...register('notifications.email')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="notifications-push"
                  className="text-sm font-medium"
                >
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive browser notifications
                </p>
              </div>
              <input
                type="checkbox"
                id="notifications-push"
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-ring"
                disabled={isSubmitting}
                {...register('notifications.push')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="notifications-sms"
                  className="text-sm font-medium"
                >
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive text message notifications
                </p>
              </div>
              <input
                type="checkbox"
                id="notifications-sms"
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-ring"
                disabled={isSubmitting}
                {...register('notifications.sms')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default PreferencesForm;
