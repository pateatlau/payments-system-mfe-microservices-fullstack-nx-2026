import React from 'react';
import { render, screen } from '@testing-library/react';
import { PaymentStatus } from 'shared-types';
import { StatusBadge, getStatusInfo } from './StatusBadge';

describe('StatusBadge (design system)', () => {
  it('maps PaymentStatus to variant/icon/tooltip', () => {
    expect(getStatusInfo(PaymentStatus.COMPLETED)).toEqual({
      variant: 'success',
      tooltip: 'Completed: payment settled successfully.',
      icon: 'check',
    });
    expect(getStatusInfo(PaymentStatus.PENDING)).toEqual({
      variant: 'warning',
      tooltip: 'Pending: payment is awaiting confirmation or action.',
      icon: 'hourglass',
    });
    expect(getStatusInfo(PaymentStatus.PROCESSING)).toEqual({
      variant: 'default',
      tooltip: 'Processing: payment is being handled by the system.',
      icon: 'spinner',
    });
    expect(getStatusInfo(PaymentStatus.FAILED)).toEqual({
      variant: 'destructive',
      tooltip: 'Failed: payment could not be completed.',
      icon: 'x',
    });
    expect(getStatusInfo(PaymentStatus.CANCELLED)).toEqual({
      variant: 'secondary',
      tooltip: 'Cancelled: payment was cancelled and will not proceed.',
      icon: 'ban',
    });
  });

  it('renders label with tooltip and icon', () => {
    const info = getStatusInfo(PaymentStatus.FAILED);
    render(
      <StatusBadge
        variant={info.variant}
        tooltip={info.tooltip}
        icon={info.icon}
      >
        failed
      </StatusBadge>
    );
    const label = screen.queryByText('failed');
    expect(label).toBeTruthy();
    const badge = label && label.closest('div');
    expect(badge && badge.getAttribute('title')).toBe(info.tooltip);
  });
});
