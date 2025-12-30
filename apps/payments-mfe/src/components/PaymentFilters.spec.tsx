import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentFilters } from './PaymentFilters';
import { PaymentStatus, PaymentType } from 'shared-types';

describe('PaymentFilters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const setup = (
    props: Partial<ComponentProps<typeof PaymentFilters>> = {}
  ) => {
    return render(<PaymentFilters debounceMs={100} {...props} />);
  };

  it('emits changes after debounce when filters update', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    setup({ onChange: handleChange });

    await user.selectOptions(
      screen.getByLabelText(/Status/i),
      PaymentStatus.PROCESSING
    );

    jest.runAllTimers();

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentStatus.PROCESSING })
    );
  });

  it('shows validation error when end date precedes start date and prevents change emit', () => {
    const handleChange = jest.fn();
    setup({ onChange: handleChange });

    fireEvent.change(screen.getByLabelText(/From date/i), {
      target: { value: '2025-12-10' },
    });
    fireEvent.change(screen.getByLabelText(/To date/i), {
      target: { value: '2025-12-01' },
    });

    jest.runAllTimers();

    expect(
      screen.getByText(/End date must be after the start date/i)
    ).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('validates amount range and blocks invalid updates', () => {
    const handleChange = jest.fn();
    setup({ onChange: handleChange });

    fireEvent.change(screen.getByLabelText(/Minimum amount/i), {
      target: { value: '9000' },
    });
    fireEvent.change(screen.getByLabelText(/Maximum amount/i), {
      target: { value: '1000' },
    });

    jest.runAllTimers();

    expect(
      screen.getByText(
        /Max amount must be greater than or equal to min amount/i
      )
    ).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('debounces rapid changes and emits only the latest values', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    setup({ onChange: handleChange });

    await user.selectOptions(
      screen.getByLabelText(/Status/i),
      PaymentStatus.PENDING
    );
    await user.selectOptions(
      screen.getByLabelText(/Type/i),
      PaymentType.SCHEDULED
    );

    jest.runAllTimers();

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: PaymentStatus.PENDING,
        type: PaymentType.SCHEDULED,
      })
    );
  });

  it('clears filters and emits reset values', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    setup({ onChange: handleChange });

    await user.selectOptions(
      screen.getByLabelText(/Status/i),
      PaymentStatus.COMPLETED
    );
    await user.selectOptions(
      screen.getByLabelText(/Type/i),
      PaymentType.RECURRING
    );

    jest.runAllTimers();

    await user.click(screen.getByRole('button', { name: /Clear filters/i }));

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith({
      status: 'all',
      type: 'all',
      fromDate: undefined,
      toDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
    expect(screen.getByText(/active filters?/i)).toHaveTextContent('0 active');
  });
});
