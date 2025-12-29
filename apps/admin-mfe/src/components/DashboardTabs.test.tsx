import { render, screen, fireEvent } from '../test-utils';
import { DashboardTabs, useDashboardTabs } from './DashboardTabs';
import { renderHook, act } from '../test-utils';

describe('DashboardTabs', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it('renders all tab options', () => {
    render(
      <DashboardTabs activeTab="overview" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Payment Reports')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<DashboardTabs activeTab="users" onTabChange={mockOnTabChange} />);

    const usersTab = screen.getByText('User Management').closest('button');
    expect(usersTab).toHaveClass('border-primary', 'text-primary');
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(
      <DashboardTabs activeTab="overview" onTabChange={mockOnTabChange} />
    );

    const paymentsTab = screen.getByText('Payment Reports');
    fireEvent.click(paymentsTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('payments');
  });

  it('applies correct ARIA attributes', () => {
    render(
      <DashboardTabs activeTab="overview" onTabChange={mockOnTabChange} />
    );

    const overviewTab = screen.getByText('Overview').closest('button');
    expect(overviewTab).toHaveAttribute('aria-current', 'page');

    const usersTab = screen.getByText('User Management').closest('button');
    expect(usersTab).not.toHaveAttribute('aria-current');
  });

  it('renders tab icons', () => {
    const { container } = render(
      <DashboardTabs activeTab="overview" onTabChange={mockOnTabChange} />
    );

    // Check for emoji icons
    expect(container.textContent).toContain('📊');
    expect(container.textContent).toContain('👥');
    expect(container.textContent).toContain('💳');
    expect(container.textContent).toContain('🔧');
  });
});

describe('useDashboardTabs', () => {
  it('initializes with default tab', () => {
    const { result } = renderHook(() => useDashboardTabs());

    expect(result.current.activeTab).toBe('overview');
  });

  it('initializes with custom tab', () => {
    const { result } = renderHook(() => useDashboardTabs('users'));

    expect(result.current.activeTab).toBe('users');
  });

  it('updates active tab', () => {
    const { result } = renderHook(() => useDashboardTabs());

    act(() => {
      result.current.setActiveTab('payments');
    });

    expect(result.current.activeTab).toBe('payments');
  });
});
