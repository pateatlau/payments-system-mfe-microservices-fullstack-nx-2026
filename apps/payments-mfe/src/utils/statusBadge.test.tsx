import { PaymentStatus } from 'shared-types';
import { getStatusInfo } from './statusBadge';

describe('statusBadge helper', () => {
  it('maps statuses to variants and tooltips', () => {
    expect(getStatusInfo(PaymentStatus.COMPLETED)).toEqual(
      expect.objectContaining({ variant: 'success', icon: 'check' })
    );
    expect(getStatusInfo(PaymentStatus.PENDING)).toEqual(
      expect.objectContaining({ variant: 'warning', icon: 'hourglass' })
    );
    expect(getStatusInfo(PaymentStatus.PROCESSING)).toEqual(
      expect.objectContaining({ variant: 'default', icon: 'spinner' })
    );
    expect(getStatusInfo(PaymentStatus.FAILED)).toEqual(
      expect.objectContaining({ variant: 'destructive', icon: 'x' })
    );
    expect(getStatusInfo(PaymentStatus.CANCELLED)).toEqual(
      expect.objectContaining({ variant: 'secondary', icon: 'ban' })
    );
  });

  it('provides a helpful tooltip', () => {
    const info = getStatusInfo(PaymentStatus.FAILED);
    expect(info.tooltip.toLowerCase()).toContain('failed');
  });
});
