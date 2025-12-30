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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
    control,
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
          <Controller
            control={control}
            name="theme"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPreferencesLoading || isSubmitting}
              >
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.theme && (
            <p className="text-xs text-red-600">
              {errors.theme.message as string}
            </p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPreferencesLoading || isSubmitting}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish (Español)</SelectItem>
                  <SelectItem value="fr">French (Français)</SelectItem>
                  <SelectItem value="de">German (Deutsch)</SelectItem>
                  <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                  <SelectItem value="zh">Chinese (中文)</SelectItem>
                  <SelectItem value="ja">Japanese (日本語)</SelectItem>
                  <SelectItem value="pt">Portuguese (Português)</SelectItem>
                  <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  <SelectItem value="ru">Russian (Русский)</SelectItem>
                </SelectContent>
              </Select>
            )}
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
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPreferencesLoading || isSubmitting}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            )}
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
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPreferencesLoading || isSubmitting}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                  <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                  <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</SelectItem>
                </SelectContent>
              </Select>
            )}
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
