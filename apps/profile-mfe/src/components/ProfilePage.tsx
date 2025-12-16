/**
 * ProfilePage Component
 *
 * Main entry point for the Profile MFE, exposed via Module Federation.
 *
 * Responsibilities:
 * - Render high-level profile layout shell
 * - Integrate loading and error states for profile data
 * - Provide tab-based navigation between Profile, Preferences, and Account views
 * - Delegate actual form/content rendering to child components (implemented in later tasks)
 */

import { useState } from 'react';
import { Alert, AlertDescription, Card } from '@mfe/shared-design-system';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';
import { PreferencesForm } from './PreferencesForm';

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
    <div className="w-full h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
          <p className="mt-2 text-slate-600">
            Manage your personal information, preferences, and account details.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
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
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')
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
            <p className="text-slate-600">Loading your profile...</p>
          </Card>
        )}

        {/* Content */}
        {!isLoading && profile && (
          <div className="space-y-4">
            {activeTab === 'profile' && <ProfileForm />}

            {activeTab === 'preferences' && <PreferencesForm />}

            {activeTab === 'account' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Account
                </h2>
                <p className="text-slate-600 text-sm">
                  Account info view will be implemented in Task 3.5.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
