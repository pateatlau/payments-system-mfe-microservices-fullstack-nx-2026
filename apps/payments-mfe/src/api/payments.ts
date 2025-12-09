import type {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'shared-types';
import { apiClient } from 'shared-api-client';
import type { CreatePaymentDto, UpdatePaymentDto } from './types';

/**
 * Backend Payments API (direct service URL - POC-2)
 *
 * Uses shared-api-client with NX_API_BASE_URL (apps/payments-mfe/rspack.config.js -> http://localhost:3002)
 */

type ListPaymentsResponse = {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

type PaymentResponse = {
  success: boolean;
  data: Payment;
};

/**
 * List payments (role-based filtering handled by backend)
 */
export async function listPayments(params?: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  type?: PaymentType;
}): Promise<Payment[]> {
  const response = await apiClient.get<ListPaymentsResponse>('/payments', {
    params,
  });
  return response.data.data.payments;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const response = await apiClient.get<PaymentResponse>(`/payments/${id}`);
  return response.data.data;
}

/**
 * Create payment
 * Note: backend requires either recipientId or recipientEmail
 */
export async function createPayment(
  payload: CreatePaymentDto
): Promise<Payment> {
  const response = await apiClient.post<PaymentResponse>(
    '/payments',
    payload
  );
  return response.data.data;
}

/**
 * Update payment status (used for cancel or state change)
 */
export async function updatePaymentStatus(
  id: string,
  payload: UpdatePaymentDto
): Promise<Payment> {
  const response = await apiClient.patch<PaymentResponse>(
    `/payments/${id}/status`,
    payload
  );
  return response.data.data;
}

