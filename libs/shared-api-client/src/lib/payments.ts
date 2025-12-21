/**
 * Payments API Client
 *
 * Provides typed functions for interacting with the Payments Service.
 * Includes robust error handling and uses the shared ApiClient with
 * JWT auth, interceptors, and consistent response handling.
 */

import { apiClient } from './apiClient';
import type { Payment, UpdatePaymentRequest } from 'shared-types';

/**
 * Payload for updating payment details via PUT.
 *
 * Alias of the shared `UpdatePaymentRequest` type to make
 * consumer imports more explicit within the API client context.
 *
 * Fields are optional to support partial updates. At least one field
 * should be provided, validated by the backend.
 */
export type UpdatePaymentData = UpdatePaymentRequest;

/**
 * Update payment details.
 *
 * Performs a PUT request to `/payments/:id` using the shared ApiClient.
 * Returns the updated `Payment` on success.
 *
 * Error Handling:
 * - Rejects on network errors (e.g., connectivity issues).
 * - Rejects on HTTP errors (handled by interceptors, includes message/code).
 * - Rejects if API responds with `success: false` with a useful message.
 *
 * @param paymentId - The ID of the payment to update.
 * @param data - The update payload (partial fields allowed).
 * @returns Promise resolving to the updated `Payment`.
 * @throws Error when request fails or API responds with an error.
 */
export async function updatePaymentDetails(
  paymentId: string,
  data: UpdatePaymentData
): Promise<Payment> {
  if (!paymentId || typeof paymentId !== 'string') {
    throw new Error('A valid paymentId is required');
  }

  try {
    const response = await apiClient.put<Payment>(
      `/payments/${paymentId}`,
      data
    );

    if (!response.success) {
      throw new Error(response.message ?? 'Failed to update payment details');
    }

    return response.data;
  } catch (error) {
    // Interceptors may already provide a well-formed Error with message/code/details.
    // Ensure a useful error is propagated regardless of error shape.
    const defaultMessage = 'Unable to update payment details';
    if (error instanceof Error) {
      throw error.message ? error : new Error(defaultMessage);
    }
    throw new Error(defaultMessage);
  }
}
