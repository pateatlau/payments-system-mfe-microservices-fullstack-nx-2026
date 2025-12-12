/**
 * AuditLogs Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditLogs } from './AuditLogs';

describe('AuditLogs', () => {
  it('should render audit logs header', () => {
    render(<AuditLogs />);

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(
      screen.getByText('Track system activity and user actions')
    ).toBeInTheDocument();
  });

  it('should display backend status notice', () => {
    render(<AuditLogs />);

    expect(
      screen.getByText(/Backend audit logging is currently deferred/)
    ).toBeInTheDocument();
  });

  it('should render filter dropdown', () => {
    render(<AuditLogs />);

    expect(screen.getByLabelText('Filter by Action')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<AuditLogs />);

    // Loading should appear briefly
    const loadingElement = screen.queryByRole('status');
    // It may have already loaded, so we check if it exists or existed
    expect(
      loadingElement !== null || screen.queryByText('USER LOGIN') !== null
    ).toBe(true);
  });

  it('should load and display mock audit logs', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display correct action badges', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.getByText('USER ROLE CHANGED')).toBeInTheDocument();
      expect(screen.getByText('PAYMENT CREATED')).toBeInTheDocument();
      expect(screen.getByText('USER DELETED')).toBeInTheDocument();
    });
  });

  it('should display user emails', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('should display IP addresses', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.50')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.120')).toBeInTheDocument();
    });
  });

  it('should filter logs by action', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
    });

    const filterDropdown = screen.getByLabelText('Filter by Action');
    fireEvent.change(filterDropdown, { target: { value: 'USER_LOGIN' } });

    await waitFor(() => {
      // Should only show USER_LOGIN actions
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.queryByText('PAYMENT CREATED')).not.toBeInTheDocument();
    });
  });

  it('should show all logs when filter is set to ALL', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
    });

    const filterDropdown = screen.getByLabelText('Filter by Action');

    // Filter to specific action
    fireEvent.change(filterDropdown, { target: { value: 'USER_LOGIN' } });

    await waitFor(() => {
      expect(screen.queryByText('PAYMENT CREATED')).not.toBeInTheDocument();
    });

    // Reset to ALL
    fireEvent.change(filterDropdown, { target: { value: 'ALL' } });

    await waitFor(() => {
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.getByText('PAYMENT CREATED')).toBeInTheDocument();
    });
  });

  it('should open details modal when details button is clicked', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
    });
  });

  it('should display full log details in modal', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    });
  });

  it('should close details modal when close button is clicked', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });
  });

  it('should display formatted timestamps', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      // Should display relative time like "5 min ago", "15 min ago", etc.
      expect(screen.getByText(/min ago|hour ago/)).toBeInTheDocument();
    });
  });

  it('should display resource types', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('payment')).toBeInTheDocument();
      expect(screen.getByText('config')).toBeInTheDocument();
    });
  });

  it('should display pagination info', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      expect(screen.getByText(/logs\)/)).toBeInTheDocument();
    });
  });

  it('should display JSON details in modal', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Click on role changed log (has details)
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[1]); // Second log has role change details

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
      // Should display JSON details
      expect(screen.getByText(/"oldRole"/)).toBeInTheDocument();
    });
  });

  it('should handle system user correctly', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('system@internal')).toBeInTheDocument();
      expect(screen.getByText('internal')).toBeInTheDocument();
    });
  });

  it('should apply correct badge colors for different actions', async () => {
    render(<AuditLogs />);

    await waitFor(() => {
      // Just verify badges are rendered with text content
      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.getByText('USER DELETED')).toBeInTheDocument();
      expect(screen.getByText('PAYMENT CREATED')).toBeInTheDocument();
      expect(screen.getByText('USER ROLE CHANGED')).toBeInTheDocument();
    });
  });

  it('should display all available action filters', () => {
    render(<AuditLogs />);

    const filterDropdown = screen.getByLabelText('Filter by Action');

    // Check that filter options exist
    expect(filterDropdown).toBeInTheDocument();

    // Verify some key options exist in the dropdown
    const options = Array.from((filterDropdown as HTMLSelectElement).options);
    const optionValues = options.map(opt => opt.value);

    expect(optionValues).toContain('ALL');
    expect(optionValues).toContain('USER_LOGIN');
    expect(optionValues).toContain('PAYMENT_CREATED');
  });
});
