/**
 * ProfilePage Component
 *
 * Main entry point for the Profile MFE, exposed via Module Federation.
 *
 * Responsibilities:
 * - Render high-level profile layout shell
 * - Integrate loading and error states for profile data
 * - Provide tab-based navigation between Profile, Preferences, and Account views
 * - Delegate actual form/content rendering to child components
 */

import { useState } from 'react';
import { Alert, AlertDescription, Card } from '@mfe/shared-design-system';
import { useProfile } from '../hooks/useProfile';
import { ProfileTabs, ProfileTabKey } from './ProfileTabs';
import { ProfileForm } from './ProfileForm';
import { PreferencesForm } from './PreferencesForm';
import { AccountInfo } from './AccountInfo';

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
        <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

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

            {activeTab === 'account' && <AccountInfo />}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
