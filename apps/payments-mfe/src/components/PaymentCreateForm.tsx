import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Select,
} from '@mfe/shared-design-system';
import { PaymentType } from 'shared-types';

/**
 * Create payment form schema using Zod
 */
const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
  currency: z.string().min(1, 'Currency is required').default('INR'),
  type: z.enum([
    PaymentType.INSTANT,
    PaymentType.SCHEDULED,
    PaymentType.RECURRING,
  ] as [PaymentType, PaymentType, PaymentType]),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description is required'),
  recipientEmail: z
    .string({ required_error: 'Recipient email is required' })
    .email('Valid recipient email is required'),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

export interface PaymentCreateFormProps {
  isSubmitting: boolean;
  isLoading: boolean;
  error?: Error | null;
  onSubmit: (data: CreatePaymentFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * PaymentCreateForm - Encapsulates the create payment form logic and UI
 */
export function PaymentCreateForm({
  isSubmitting,
  isLoading,
  error,
  onSubmit,
  onCancel,
}: PaymentCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      currency: 'INR',
      type: PaymentType.INSTANT,
      description: '',
      recipientEmail: '',
    },
  });

  const onSubmitHandler = async (data: CreatePaymentFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Payment</CardTitle>
        <CardDescription>
          Enter payment details to create a new payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', {
                  valueAsNumber: true,
                })}
                placeholder="0.00"
                className="mt-2"
              />
              {errors.amount && (
                <p
                  className="mt-1 text-sm text-destructive-foreground"
                  role="alert"
                >
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select id="currency" {...register('currency')} className="mt-2">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </Select>
              {errors.currency && (
                <p
                  className="mt-1 text-sm text-destructive-foreground"
                  role="alert"
                >
                  {errors.currency.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="type">Payment Type *</Label>
            <Select id="type" {...register('type')} className="mt-2">
              <option value={PaymentType.INSTANT}>Instant</option>
              <option value={PaymentType.SCHEDULED}>Scheduled</option>
              <option value={PaymentType.RECURRING}>Recurring</option>
            </Select>
            {errors.type && (
              <p
                className="mt-1 text-sm text-destructive-foreground"
                role="alert"
              >
                {errors.type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              type="text"
              {...register('description')}
              placeholder="Payment description"
              className="mt-2"
            />
            {errors.description && (
              <p
                className="mt-1 text-sm text-destructive-foreground"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              {...register('recipientEmail')}
              placeholder="recipient@example.com"
              className="mt-2"
            />
            {errors.recipientEmail && (
              <p
                className="mt-1 text-sm text-destructive-foreground"
                role="alert"
              >
                {errors.recipientEmail.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || 'Failed to create payment'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 mt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? 'Creating...' : 'Create Payment'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onCancel();
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
