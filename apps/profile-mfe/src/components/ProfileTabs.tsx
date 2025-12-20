/**
 * ProfileTabs Component
 *
 * Reusable tab navigation component for ProfilePage.
 * Provides accessible tab switching with proper ARIA attributes.
 */

// Tab identifiers for ProfilePage
export type ProfileTabKey = 'profile' | 'preferences' | 'account';

/**
 * Tab configuration interface
 */
export interface ProfileTabConfig {
  key: ProfileTabKey;
  label: string;
}

/**
 * Props for ProfileTabs component
 */
export interface ProfileTabsProps {
  /** Currently active tab */
  activeTab: ProfileTabKey;
  /** Callback when tab changes */
  onTabChange: (tab: ProfileTabKey) => void;
  /** Optional custom tab configuration */
  tabs?: ProfileTabConfig[];
}

/**
 * Default tab configuration
 */
const DEFAULT_TABS: ProfileTabConfig[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'account', label: 'Account' },
];

/**
 * ProfileTabs component
 *
 * Renders accessible tab navigation with proper ARIA attributes
 * and visual feedback for active state.
 */
export function ProfileTabs({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}: ProfileTabsProps) {
  const handleTabClick = (tab: ProfileTabKey) => {
    onTabChange(tab);
  };

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="-mb-px flex space-x-6" aria-label="Profile tabs">
        {tabs.map((tab, _index) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={
              'whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ' +
              (activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')
            }
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            role="tab"
            tabIndex={activeTab === tab.key ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProfileTabs;
