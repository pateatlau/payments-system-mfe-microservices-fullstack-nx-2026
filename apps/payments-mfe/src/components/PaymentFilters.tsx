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
  Select,
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
              <Select id="status" {...register('status')}>
                <option value="all">All statuses</option>
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.PROCESSING}>Processing</option>
                <option value={PaymentStatus.COMPLETED}>Completed</option>
                <option value={PaymentStatus.FAILED}>Failed</option>
                <option value={PaymentStatus.CANCELLED}>Cancelled</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...register('type')}>
                <option value="all">All types</option>
                <option value={PaymentType.INSTANT}>Instant</option>
                <option value={PaymentType.SCHEDULED}>Scheduled</option>
                <option value={PaymentType.RECURRING}>Recurring</option>
              </Select>
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
              <span className="text-xs text-muted-foreground">
                {MIN_AMOUNT.toLocaleString()} - {MAX_AMOUNT.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Display min and max values */}
              <div className="flex items-center justify-between text-sm text-muted-foreground font-semibold">
                <span aria-live="polite">
                  Minimum: $
                  {watchedValues.minAmount?.toLocaleString?.() ?? MIN_AMOUNT}
                </span>
                <span aria-live="polite">
                  Maximum: $
                  {watchedValues.maxAmount?.toLocaleString?.() ?? MAX_AMOUNT}
                </span>
              </div>

              {/* Dual-handle range slider (overlapping inputs) */}
              <div className="space-y-2">
                <div className="relative h-8">
                  <Controller
                    control={control}
                    name="minAmount"
                    render={({ field: minField }) => (
                      <Controller
                        control={control}
                        name="maxAmount"
                        render={({ field: maxField }) => (
                          <>
                            {/* Min slider (behind) */}
                            <input
                              type="range"
                              min={MIN_AMOUNT}
                              max={MAX_AMOUNT}
                              step={50}
                              aria-label="Minimum amount slider"
                              value={minField.value ?? MIN_AMOUNT}
                              onChange={event => {
                                const val = Number(event.target.value);
                                if (val <= (maxField.value ?? MAX_AMOUNT)) {
                                  minField.onChange(val);
                                }
                              }}
                              className="absolute top-1/2 w-full h-6 -translate-y-1/2 cursor-pointer appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:border-0 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:mt-[-6px]"
                              style={{
                                zIndex:
                                  (minField.value ?? MIN_AMOUNT) >
                                  (watchedValues.maxAmount ?? MAX_AMOUNT) -
                                    (MAX_AMOUNT - MIN_AMOUNT) / 2
                                    ? 20
                                    : 18,
                              }}
                            />

                            {/* Max slider (in front) */}
                            <input
                              type="range"
                              min={MIN_AMOUNT}
                              max={MAX_AMOUNT}
                              step={50}
                              aria-label="Maximum amount slider"
                              value={maxField.value ?? MAX_AMOUNT}
                              onChange={event => {
                                const val = Number(event.target.value);
                                if (val >= (minField.value ?? MIN_AMOUNT)) {
                                  maxField.onChange(val);
                                }
                              }}
                              className="absolute top-1/2 w-full h-6 -translate-y-1/2 cursor-pointer appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:border-0 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:mt-[-6px]"
                              style={{
                                zIndex:
                                  (maxField.value ?? MAX_AMOUNT) <
                                  (watchedValues.minAmount ?? MIN_AMOUNT) +
                                    (MAX_AMOUNT - MIN_AMOUNT) / 2
                                    ? 22
                                    : 21,
                              }}
                            />

                            {/* Track background */}
                            <div className="pointer-events-none absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full border border-border bg-muted" />
                            {/* Filled track */}
                            <div
                              className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
                              style={{
                                left: `${(((minField.value ?? MIN_AMOUNT) - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100}%`,
                                right: `${100 - (((maxField.value ?? MAX_AMOUNT) - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100}%`,
                                zIndex: 10,
                              }}
                            />
                          </>
                        )}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Display input fields as alternative input method */}
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  control={control}
                  name="minAmount"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label htmlFor="min-amount-input" className="text-xs">
                        Min
                      </Label>
                      <Input
                        id="min-amount-input"
                        type="number"
                        min={MIN_AMOUNT}
                        max={MAX_AMOUNT}
                        step={50}
                        value={field.value ?? MIN_AMOUNT}
                        onChange={event => {
                          const raw = Number(event.target.value);
                          const clamped = Math.max(
                            MIN_AMOUNT,
                            Math.min(raw, MAX_AMOUNT)
                          );
                          if (
                            clamped <= (watchedValues.maxAmount ?? MAX_AMOUNT)
                          ) {
                            field.onChange(clamped);
                          }
                        }}
                        className="text-sm"
                        aria-label="Minimum amount input"
                      />
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="maxAmount"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label htmlFor="max-amount-input" className="text-xs">
                        Max
                      </Label>
                      <Input
                        id="max-amount-input"
                        type="number"
                        min={MIN_AMOUNT}
                        max={MAX_AMOUNT}
                        step={50}
                        value={field.value ?? MAX_AMOUNT}
                        onChange={event => {
                          const raw = Number(event.target.value);
                          const clamped = Math.max(
                            MIN_AMOUNT,
                            Math.min(raw, MAX_AMOUNT)
                          );
                          if (
                            clamped >= (watchedValues.minAmount ?? MIN_AMOUNT)
                          ) {
                            field.onChange(clamped);
                          }
                        }}
                        className="text-sm"
                        aria-label="Maximum amount input"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
            {(errors.minAmount || errors.maxAmount) && (
              <p className="text-sm text-red-600" role="alert">
                {errors.maxAmount?.message || errors.minAmount?.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
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
