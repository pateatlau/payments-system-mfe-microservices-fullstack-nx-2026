/**
 * Dashboard Navigation Tabs Component
 * Provides tab-based navigation for different admin sections
 */

import { useState } from 'react';
import { cn } from '@mfe/shared-design-system';

export type DashboardTab = 'overview' | 'users' | 'payments' | 'audit' | 'system';

export interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'payments', label: 'Payment Reports', icon: '💳' },
  { id: 'audit', label: 'Audit Logs', icon: '📋' },
  { id: 'system', label: 'System Health', icon: '🔧' },
];

/**
 * DashboardTabs Component
 * Renders navigation tabs for the admin dashboard
 */
export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Hook to manage dashboard tabs
 */
export function useDashboardTabs(initialTab: DashboardTab = 'overview') {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  return {
    activeTab,
    setActiveTab,
  };
}
