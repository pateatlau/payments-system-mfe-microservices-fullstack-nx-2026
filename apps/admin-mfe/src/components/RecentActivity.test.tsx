import { render, screen } from '@testing-library/react';
import { RecentActivity, type ActivityItem } from './RecentActivity';

describe('RecentActivity', () => {
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'user',
      action: 'New user registered',
      user: 'john.doe@example.com',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'success',
    },
    {
      id: '2',
      type: 'payment',
      action: 'Payment completed',
      user: 'alice.smith@example.com',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'success',
    },
    {
      id: '3',
      type: 'system',
      action: 'Database backup completed',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      status: 'success',
    },
  ];

  it('renders activity list correctly', () => {
    render(<RecentActivity activities={mockActivities} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New user registered')).toBeInTheDocument();
    expect(screen.getByText('Payment completed')).toBeInTheDocument();
    expect(screen.getByText('Database backup completed')).toBeInTheDocument();
  });

  it('displays user information for activities', () => {
    render(<RecentActivity activities={mockActivities} />);

    expect(screen.getByText('by john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('by alice.smith@example.com')).toBeInTheDocument();
  });

  it('renders activity badges', () => {
    render(<RecentActivity activities={mockActivities} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('payment')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('respects maxItems limit', () => {
    const manyActivities = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      type: 'user' as const,
      action: `Activity ${i}`,
      timestamp: new Date().toISOString(),
    }));

    render(<RecentActivity activities={manyActivities} maxItems={5} />);

    // Should only show 5 activities
    expect(screen.getAllByText(/Activity/).length).toBe(5);
  });

  it('shows empty state when no activities', () => {
    render(<RecentActivity activities={[]} />);

    expect(
      screen.getByText('No recent activity to display')
    ).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<RecentActivity activities={mockActivities} isLoading={true} />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('formats relative timestamps correctly', () => {
    render(<RecentActivity activities={mockActivities} />);

    // Check for relative time formats (e.g., "5m ago", "15m ago")
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });
});
