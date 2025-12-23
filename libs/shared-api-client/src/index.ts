/**
 * Shared API Client Library
 *
 * Provides a type-safe HTTP client with:
 * - JWT token injection
 * - Automatic token refresh
 * - Error handling and retry logic
 * - Type-safe request/response handling
 */

export {
  ApiClient,
  apiClient,
  getApiClient,
  type ApiClientConfig,
  type TokenProvider,
  type ApiResponse,
  type ApiError,
} from './lib/apiClient';

export { setupInterceptors } from './lib/interceptors';

// Payments API
export { updatePaymentDetails, type UpdatePaymentData } from './lib/payments';
