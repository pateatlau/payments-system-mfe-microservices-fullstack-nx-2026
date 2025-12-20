/**
 * ProfileTabs Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileTabs, ProfileTabKey } from './ProfileTabs';

describe('ProfileTabs', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it('renders all default tabs', () => {
    render(<ProfileTabs activeTab="profile" onTabChange={mockOnTabChange} />);

    expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Preferences' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
  });

  it('renders custom tabs when provided', () => {
    const customTabs = [
      { key: 'profile' as ProfileTabKey, label: 'My Profile' },
      { key: 'account' as ProfileTabKey, label: 'My Account' },
    ];

    render(
      <ProfileTabs
        activeTab="profile"
        onTabChange={mockOnTabChange}
        tabs={customTabs}
      />
    );

    expect(screen.getByRole('tab', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Account' })).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Preferences' })
    ).not.toBeInTheDocument();
  });

  it('highlights the active tab correctly', () => {
    render(
      <ProfileTabs activeTab="preferences" onTabChange={mockOnTabChange} />
    );

    const preferencesTab = screen.getByRole('tab', { name: 'Preferences' });
    const _profileTab = screen.getByRole('tab', { name: 'Profile' });

    expect(preferencesTab).toHaveAttribute('aria-selected', 'true');
    expect(preferencesTab).toHaveClass(
      'border-primary-600',
      'text-primary-700'
    );

    expect(_profileTab).toHaveAttribute('aria-selected', 'false');
    expect(_profileTab).toHaveClass('border-transparent', 'text-slate-500');
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(<ProfileTabs activeTab="profile" onTabChange={mockOnTabChange} />);

    const preferencesTab = screen.getByRole('tab', { name: 'Preferences' });
    fireEvent.click(preferencesTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('preferences');
  });

  it('sets correct ARIA attributes', () => {
    render(<ProfileTabs activeTab="account" onTabChange={mockOnTabChange} />);

    const accountTab = screen.getByRole('tab', { name: 'Account' });
    const _profileTab = screen.getByRole('tab', { name: 'Profile' });

    // Active tab
    expect(accountTab).toHaveAttribute('aria-selected', 'true');
    expect(accountTab).toHaveAttribute('aria-controls', 'tabpanel-account');
    expect(accountTab).toHaveAttribute('id', 'tab-account');
    expect(accountTab).toHaveAttribute('tabIndex', '0');

    // Inactive tab
    expect(_profileTab).toHaveAttribute('aria-selected', 'false');
    expect(_profileTab).toHaveAttribute('aria-controls', 'tabpanel-profile');
    expect(_profileTab).toHaveAttribute('id', 'tab-profile');
    expect(_profileTab).toHaveAttribute('tabIndex', '-1');
  });

  it('has proper accessibility structure', () => {
    render(<ProfileTabs activeTab="profile" onTabChange={mockOnTabChange} />);

    const nav = screen.getByRole('navigation', { name: 'Profile tabs' });
    expect(nav).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('handles keyboard interaction visually', () => {
    render(<ProfileTabs activeTab="profile" onTabChange={mockOnTabChange} />);

    const _profileTab = screen.getByRole('tab', { name: 'Profile' });
    const preferencesTab = screen.getByRole('tab', { name: 'Preferences' });

    // Test hover state by simulating mouse enter/leave
    fireEvent.mouseEnter(preferencesTab);
    expect(preferencesTab).toHaveClass(
      'hover:text-slate-700',
      'hover:border-slate-300'
    );

    fireEvent.mouseLeave(preferencesTab);
    // Should still have hover classes as they're part of the base styling
    expect(preferencesTab).toHaveClass(
      'hover:text-slate-700',
      'hover:border-slate-300'
    );
  });
});
