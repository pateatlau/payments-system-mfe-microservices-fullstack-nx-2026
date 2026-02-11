/**
 * Shared API Client Library
 *
 * Provides a type-safe HTTP client with:
 * - JWT token injection
 * - Automatic token refresh
 * - CSRF token handling (double-submit cookie pattern)
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

// CSRF Token Management
export {
  initCsrfToken,
  getCsrfToken,
  refreshCsrfToken,
  clearCsrfToken,
  CSRF_HEADER_NAME,
} from './lib/csrf';

// Payments API
export { updatePaymentDetails, type UpdatePaymentData } from './lib/payments';
