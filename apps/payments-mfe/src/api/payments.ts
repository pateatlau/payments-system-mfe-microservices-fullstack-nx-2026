import type { Payment, PaymentStatus, PaymentType } from 'shared-types';
import { ApiClient, type TokenProvider } from 'shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import type {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentReports,
  PaymentReportsParams,
} from './types';

/**
 * Backend Payments API (direct service URL - POC-2)
 *
 * Uses Payments Service direct URL (http://localhost:3002)
 * Note: When loaded in shell context, we need to explicitly set baseURL
 * since the shell's NX_API_BASE_URL points to Auth Service
 */
// Create payments-specific API client with Payments Service URL
// Access environment variable (replaced by DefinePlugin at build time)
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;
// Use Payments Service URL (port 3002) - this is set in payments-mfe rspack.config.js
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
  baseURL: envBaseURL ?? 'http://localhost:3002',
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
}): Promise<Payment[]> {
  const response = await paymentsApiClient.get<ListPaymentsResponse>(
    '/payments',
    {
      params,
    }
  );

  // Validate response structure
  if (!response?.data?.payments) {
    console.error('Invalid response structure:', response.data);
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
    console.error('Invalid response structure:', response);
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
    console.error('Invalid response structure:', response);
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
    console.error('Invalid response structure:', response);
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
    console.error('Invalid response structure:', response);
    throw new Error('Invalid response structure from payments API');
  }

  return response.data;
}
