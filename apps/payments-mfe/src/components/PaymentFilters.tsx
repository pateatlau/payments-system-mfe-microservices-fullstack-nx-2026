import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentStatus, PaymentType } from 'shared-types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  cn,
} from '@mfe/shared-design-system';

export type PaymentFiltersValue = {
  status?: PaymentStatus | 'all';
  type?: PaymentType | 'all';
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

export interface PaymentFiltersProps {
  value?: PaymentFiltersValue;
  onChange?: (filters: PaymentFiltersValue) => void;
  className?: string;
  debounceMs?: number;
}

const MIN_AMOUNT = 0;
const MAX_AMOUNT = 10000;

const filterStatusOptions = [
  'all',
  PaymentStatus.PENDING,
  PaymentStatus.PROCESSING,
  PaymentStatus.COMPLETED,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
] as const;

const filterTypeOptions = [
  'all',
  PaymentType.INSTANT,
  PaymentType.SCHEDULED,
  PaymentType.RECURRING,
] as const;

const filtersSchema = z
  .object({
    status: z.enum(filterStatusOptions),
    type: z.enum(filterTypeOptions),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    minAmount: z.number().min(MIN_AMOUNT).max(MAX_AMOUNT).optional(),
    maxAmount: z.number().min(MIN_AMOUNT).max(MAX_AMOUNT).optional(),
  })
  .refine(
    values =>
      values.minAmount === undefined ||
      values.maxAmount === undefined ||
      values.minAmount <= values.maxAmount,
    {
      path: ['maxAmount'],
      message: 'Max amount must be greater than or equal to min amount',
    }
  )
  .refine(
    values =>
      !values.fromDate ||
      !values.toDate ||
      new Date(values.fromDate).getTime() <= new Date(values.toDate).getTime(),
    {
      path: ['toDate'],
      message: 'End date must be after the start date',
    }
  );

type FiltersFormValues = z.infer<typeof filtersSchema>;

function getDefaultValues(value?: PaymentFiltersValue): FiltersFormValues {
  return {
    status: (value?.status ?? 'all') as FiltersFormValues['status'],
    type: (value?.type ?? 'all') as FiltersFormValues['type'],
    fromDate: value?.fromDate ?? '',
    toDate: value?.toDate ?? '',
    minAmount: value?.minAmount ?? MIN_AMOUNT,
    maxAmount: value?.maxAmount ?? MAX_AMOUNT,
  };
}

function normalizeFilters(values: FiltersFormValues): PaymentFiltersValue {
  const minAmount = Number.isFinite(values.minAmount)
    ? values.minAmount
    : undefined;
  const maxAmount = Number.isFinite(values.maxAmount)
    ? values.maxAmount
    : undefined;

  const isDefaultRange = minAmount === MIN_AMOUNT && maxAmount === MAX_AMOUNT;

  return {
    status: values.status,
    type: values.type,
    fromDate: values.fromDate || undefined,
    toDate: values.toDate || undefined,
    minAmount: isDefaultRange ? undefined : minAmount,
    maxAmount: isDefaultRange ? undefined : maxAmount,
  };
}

function countActiveFilters(filters: PaymentFiltersValue): number {
  let count = 0;
  if (filters.status && filters.status !== 'all') count += 1;
  if (filters.type && filters.type !== 'all') count += 1;
  if (filters.fromDate) count += 1;
  if (filters.toDate) count += 1;
  if (filters.minAmount !== undefined) count += 1;
  if (filters.maxAmount !== undefined) count += 1;
  return count;
}

export function PaymentFilters({
  value,
  onChange,
  className,
  debounceMs = 300,
}: PaymentFiltersProps) {
  const defaultValues = useMemo(() => getDefaultValues(value), [value]);
  const initialRender = useRef(true);
  const skipNextChange = useRef(false);

  const {
    control,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<FiltersFormValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    skipNextChange.current = true;
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedValues = watch();
  const parsedFilters = filtersSchema.safeParse(watchedValues);
  const normalizedFilters = parsedFilters.success
    ? normalizeFilters(parsedFilters.data)
    : undefined;
  const activeFilters = normalizedFilters
    ? countActiveFilters(normalizedFilters)
    : 0;

  useEffect(() => {
    if (!parsedFilters.success) return;

    if (skipNextChange.current) {
      skipNextChange.current = false;
      return;
    }

    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      onChange?.(normalizeFilters(parsedFilters.data));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [parsedFilters, onChange, debounceMs]);

  const handleClear = () => {
    const resetValues = getDefaultValues();
    skipNextChange.current = true;
    reset(resetValues);
    onChange?.(normalizeFilters(resetValues));
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Refine payments by status, type, date range, and amount.
          </CardDescription>
        </div>
        <Badge variant="outline" aria-label="Active filters">
          {activeFilters} active
        </Badge>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" aria-label="Payment filters">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="all">All statuses</option>
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.PROCESSING}>Processing</option>
                <option value={PaymentStatus.COMPLETED}>Completed</option>
                <option value={PaymentStatus.FAILED}>Failed</option>
                <option value={PaymentStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="all">All types</option>
                <option value={PaymentType.INSTANT}>Instant</option>
                <option value={PaymentType.SCHEDULED}>Scheduled</option>
                <option value={PaymentType.RECURRING}>Recurring</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Date range</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  id="fromDate"
                  type="date"
                  aria-label="From date"
                  {...register('fromDate')}
                />
                <Input
                  id="toDate"
                  type="date"
                  aria-label="To date"
                  {...register('toDate')}
                />
              </div>
              {errors.toDate?.message && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.toDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Amount range</Label>
              <span className="text-xs text-slate-500">
                {MIN_AMOUNT.toLocaleString()} - {MAX_AMOUNT.toLocaleString()}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="minAmount"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Minimum</span>
                      <span className="font-semibold" aria-live="polite">
                        {field.value?.toLocaleString?.() ?? MIN_AMOUNT}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step={50}
                      aria-label="Minimum amount"
                      value={field.value ?? MIN_AMOUNT}
                      onChange={event =>
                        field.onChange(Number(event.target.value))
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              />

              <Controller
                control={control}
                name="maxAmount"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Maximum</span>
                      <span className="font-semibold" aria-live="polite">
                        {field.value?.toLocaleString?.() ?? MAX_AMOUNT}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step={50}
                      aria-label="Maximum amount"
                      value={field.value ?? MAX_AMOUNT}
                      onChange={event =>
                        field.onChange(Number(event.target.value))
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              />
            </div>
            {(errors.minAmount || errors.maxAmount) && (
              <p className="text-sm text-red-600" role="alert">
                {errors.maxAmount?.message || errors.minAmount?.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              {activeFilters} active filter{activeFilters === 1 ? '' : 's'}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleClear}>
                Clear filters
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default PaymentFilters;
