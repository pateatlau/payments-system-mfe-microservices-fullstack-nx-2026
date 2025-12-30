/**
 * ProfilePage Component
 *
 * Main entry point for the Profile MFE, exposed via Module Federation.
 * Provides a complete profile management interface with tabbed navigation.
 *
 * @component
 * @example
 * ```tsx
 * // Exposed via Module Federation
 * const ProfilePage = React.lazy(() =>
 *   import('profileMfe/ProfilePage')
 * );
 *
 * <ProfilePage />
 * ```
 *
 * Responsibilities:
 * - Render high-level profile layout shell with header and navigation
 * - Integrate loading and error states for profile data fetching
 * - Provide tab-based navigation between Profile, Preferences, and Account views
 * - Delegate actual form/content rendering to specialized child components
 * - Handle authentication state and data loading coordination
 *
 * Features:
 * - Responsive tab navigation (Profile/Preferences/Account)
 * - Loading skeleton while profile data loads
 * - Error handling with user-friendly messages
 * - Form state preservation during tab switching
 * - Module Federation compatibility for microfrontend architecture
 *
 * @uses useProfile hook for data fetching
 * @uses ProfileForm for profile editing
 * @uses PreferencesForm for preference management
 * @uses AccountInfo for account details display
 * @uses Design system components for consistent UI
 *
 * @returns {JSX.Element} The main profile page component
 */

import { useState } from 'react';
import { Alert, AlertDescription, Card } from '@mfe/shared-design-system';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';
import { PreferencesForm } from './PreferencesForm';
import { AccountInfo } from './AccountInfo';

// Tab identifiers for ProfilePage
export type ProfileTabKey = 'profile' | 'preferences' | 'account';

/**
 * Simple tab configuration used for rendering navigation
 * and mapping to child content.
 */
const PROFILE_TABS: Array<{ key: ProfileTabKey; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'account', label: 'Account' },
];

export function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('profile');

  const handleTabChange = (tab: ProfileTabKey) => {
    setActiveTab(tab);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your personal information, preferences, and account details.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="-mb-px flex space-x-6" aria-label="Profile tabs">
            {PROFILE_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={
                  'whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ' +
                  (activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Failed to load profile information. Please try refreshing the
              page.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading && !profile && (
          <Card className="p-6">
            <p className="text-muted-foreground">Loading your profile...</p>
          </Card>
        )}

        {/* Content */}
        {!isLoading && profile && (
          <div className="space-y-4">
            {activeTab === 'profile' && <ProfileForm />}

            {activeTab === 'preferences' && <PreferencesForm />}

            {activeTab === 'account' && <AccountInfo />}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
