import type { Payment, PaymentStatus, PaymentType } from 'shared-types';
import { ApiClient, type TokenProvider } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import type {
  CreatePaymentDto,
  UpdatePaymentDto,
  UpdatePaymentDetailsDto,
  PaymentReports,
  PaymentReportsParams,
} from './types';

/**
 * Backend Payments API (via API Gateway - POC-3)
 *
 * Development: Direct to API Gateway
 * Production: Through nginx proxy
 *
 * URL Structure:
 * Development:
 * - Frontend → API Gateway: http://localhost:3000/api/payments/*
 * - API Gateway → Payments Service: http://localhost:3002/api/payments/*
 *
 * Production:
 * - Frontend: https://localhost/api/payments/*
 * - nginx → API Gateway: http://localhost:3000/api/payments/*
 * - API Gateway → Payments Service: http://localhost:3002/api/payments/*
 */
// Access environment variable (replaced by DefinePlugin at build time)
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;

// Create token provider that accesses auth store directly (Zustand allows direct access)
// Token provider functions access store state dynamically on each call
const tokenProvider: TokenProvider = {
  getAccessToken: () => useAuthStore.getState().accessToken ?? null,
  getRefreshToken: () => useAuthStore.getState().refreshToken ?? null,
  setTokens: (accessToken: string, refreshToken: string) => {
    useAuthStore.setState({ accessToken, refreshToken });
  },
  clearTokens: () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null });
  },
};

const paymentsApiClient = new ApiClient({
  // Use API Gateway URL (without /payments suffix - added in API calls)
  // Development: http://localhost:3000/api
  // Production: https://localhost/api
  baseURL: envBaseURL || 'http://localhost:3000/api',
  tokenProvider,
  onTokenRefresh: (accessToken: string, refreshToken: string) => {
    useAuthStore.setState({ accessToken, refreshToken });
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

// Note: ApiClient unwraps the { success, data } wrapper from backend responses
// So the response we receive is the backend's `data` property directly
type ListPaymentsResponse = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PaymentResponse = Payment;

/**
 * List payments (role-based filtering handled by backend)
 */
export async function listPayments(params?: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  type?: PaymentType;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}): Promise<Payment[]> {
  const response = await paymentsApiClient.get<ListPaymentsResponse>(
    '/payments',
    {
      params,
    }
  );

  // Validate response structure
  if (!response?.data?.payments) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data.payments;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const response = await paymentsApiClient.get<PaymentResponse>(
    `/payments/${id}`
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}

/**
 * Create payment
 * Note: backend requires either recipientId or recipientEmail
 */
export async function createPayment(
  payload: CreatePaymentDto
): Promise<Payment> {
  const response = await paymentsApiClient.post<PaymentResponse>(
    '/payments',
    payload
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}

/**
 * Update payment status (used for cancel or state change)
 */
export async function updatePaymentStatus(
  id: string,
  payload: UpdatePaymentDto
): Promise<Payment> {
  const response = await paymentsApiClient.patch<PaymentResponse>(
    `/payments/${id}/status`,
    payload
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}

/**
 * Update payment details (amount, currency, description, recipient, metadata)
 * Cannot update completed or failed payments
 */
export async function updatePaymentDetails(
  id: string,
  payload: UpdatePaymentDetailsDto
): Promise<Payment> {
  const response = await paymentsApiClient.put<PaymentResponse>(
    `/payments/${id}`,
    payload
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}

/**
 * Get payment reports (VENDOR and ADMIN only)
 */
export async function getPaymentReports(
  params?: PaymentReportsParams
): Promise<PaymentReports> {
  const response = await paymentsApiClient.get<PaymentReports>(
    '/payments/reports',
    {
      params,
    }
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}
