import { render, screen } from '../test-utils';
import { DashboardStats, type DashboardStat } from './DashboardStats';

describe('DashboardStats', () => {
  const mockStats: DashboardStat[] = [
    {
      label: 'Total Users',
      value: 1247,
      trend: { value: 12.5, isPositive: true },
    },
    {
      label: 'Active Payments',
      value: 89,
      trend: { value: 8.2, isPositive: true },
    },
    {
      label: 'Total Volume',
      value: '$45,231',
      trend: { value: 3.1, isPositive: false },
    },
    {
      label: 'System Health',
      value: '98.5%',
    },
  ];

  it('renders all stats correctly', () => {
    render(<DashboardStats stats={mockStats} />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1247')).toBeInTheDocument();
    expect(screen.getByText('Active Payments')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
  });

  it('displays positive trends correctly', () => {
    render(<DashboardStats stats={mockStats} />);

    // Check for positive trend indicators
    const positiveTrends = screen.getAllByText(/↑/);
    expect(positiveTrends.length).toBe(2); // Two stats have positive trends
  });

  it('displays negative trends correctly', () => {
    render(<DashboardStats stats={mockStats} />);

    // Check for negative trend indicator
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<DashboardStats stats={mockStats} isLoading={true} />);

    // Check for loading skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles stats without trends', () => {
    render(<DashboardStats stats={mockStats} />);

    // System Health stat has no trend
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('98.5%')).toBeInTheDocument();
  });

  it('renders in responsive grid layout', () => {
    const { container } = render(<DashboardStats stats={mockStats} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
  });
});
