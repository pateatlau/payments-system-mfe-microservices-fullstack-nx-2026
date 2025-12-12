/**
 * SystemHealth Component Tests
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { SystemHealth } from './SystemHealth';
import * as systemHealthApi from '../api/system-health';

// Mock the system health API
jest.mock('../api/system-health', () => ({
  ...jest.requireActual('../api/system-health'),
  getSystemHealth: jest.fn(),
}));

describe('SystemHealth', () => {
  const mockHealthData = {
    status: 'healthy' as const,
    timestamp: '2026-01-15T10:30:00.000Z',
    services: {
      database: 'healthy' as const,
      redis: 'healthy' as const,
      authService: 'healthy' as const,
      paymentsService: 'healthy' as const,
    },
    version: '1.0.0',
    uptime: 86400, // 1 day
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render system health header', () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time monitoring of system services')
    ).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<SystemHealth />);

    expect(screen.getAllByRole('status')[0]).toBeInTheDocument();
  });

  it('should load and display system health data', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('should display all services', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('PostgreSQL Database')).toBeInTheDocument();
      expect(screen.getByText('Redis Cache')).toBeInTheDocument();
      expect(screen.getByText('Auth Service')).toBeInTheDocument();
      expect(screen.getByText('Payments Service')).toBeInTheDocument();
    });
  });

  it('should display service status badges', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      const healthyBadges = screen.getAllByText('healthy');
      expect(healthyBadges.length).toBeGreaterThan(0);
    });
  });

  it('should handle API errors', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockRejectedValue(
      new Error('Failed to load health data')
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load health data')
      ).toBeInTheDocument();
    });
  });

  it('should display degraded status', async () => {
    const degradedData = {
      ...mockHealthData,
      status: 'degraded' as const,
      services: {
        ...mockHealthData.services,
        redis: 'degraded' as const,
      },
    };

    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      degradedData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();
      expect(screen.getByText('degraded')).toBeInTheDocument();
    });
  });

  it('should display unhealthy status', async () => {
    const unhealthyData = {
      ...mockHealthData,
      status: 'unhealthy' as const,
      services: {
        ...mockHealthData.services,
        paymentsService: 'unhealthy' as const,
      },
    };

    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      unhealthyData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('UNHEALTHY')).toBeInTheDocument();
      expect(screen.getByText('unhealthy')).toBeInTheDocument();
    });
  });

  it('should display formatted uptime', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('1d 0h 0m')).toBeInTheDocument();
    });
  });

  it('should display timestamp', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
    });
  });

  it('should handle manual refresh', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(systemHealthApi.getSystemHealth).toHaveBeenCalledTimes(2);
    });
  });

  it('should toggle auto-refresh', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    const autoRefreshCheckbox = screen.getByLabelText(/Auto-refresh/);
    expect(autoRefreshCheckbox).toBeChecked();

    fireEvent.click(autoRefreshCheckbox);

    expect(autoRefreshCheckbox).not.toBeChecked();
  });

  it('should auto-refresh at specified interval', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    // Initial call
    expect(systemHealthApi.getSystemHealth).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds (default interval)
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(systemHealthApi.getSystemHealth).toHaveBeenCalledTimes(2);
    });
  });

  it('should change refresh interval', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    const intervalSelect = screen.getByLabelText('Refresh Interval:');
    fireEvent.change(intervalSelect, { target: { value: '10' } });

    expect(intervalSelect).toHaveValue('10');
  });

  it('should disable interval selector when auto-refresh is off', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    const autoRefreshCheckbox = screen.getByLabelText(/Auto-refresh/);
    fireEvent.click(autoRefreshCheckbox);

    const intervalSelect = screen.getByLabelText('Refresh Interval:');
    expect(intervalSelect).toBeDisabled();
  });

  it('should display active/paused status', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    const autoRefreshCheckbox = screen.getByLabelText(/Auto-refresh/);
    fireEvent.click(autoRefreshCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });
  });

  it('should display refreshing state', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  it('should display service icons', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      // Check for healthy icon (✅)
      const serviceCards = screen.getAllByText('✅');
      expect(serviceCards.length).toBeGreaterThan(0);
    });
  });

  it('should display version information', async () => {
    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      mockHealthData
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('should handle missing uptime gracefully', async () => {
    const dataWithoutUptime = {
      ...mockHealthData,
      uptime: undefined,
    };

    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      dataWithoutUptime
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });

    // Uptime should not be displayed
    expect(screen.queryByText('Uptime')).not.toBeInTheDocument();
  });

  it('should format uptime correctly for hours', async () => {
    const dataWithHoursUptime = {
      ...mockHealthData,
      uptime: 7200, // 2 hours
    };

    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      dataWithHoursUptime
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('2h 0m')).toBeInTheDocument();
    });
  });

  it('should format uptime correctly for minutes', async () => {
    const dataWithMinutesUptime = {
      ...mockHealthData,
      uptime: 300, // 5 minutes
    };

    (systemHealthApi.getSystemHealth as jest.Mock).mockResolvedValue(
      dataWithMinutesUptime
    );

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('5m')).toBeInTheDocument();
    });
  });
});
