/**
 * Payments API Client Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { updatePaymentDetails, type UpdatePaymentData } from './payments';
import { PaymentStatus, PaymentType } from 'shared-types';

// Mock axios before using ApiClient via proxy
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Use a shared mock instance to avoid stale proxies across tests
const sharedMockAxiosInstance: {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
} = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

describe('Payments API - updatePaymentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset methods without reassigning the instance reference
    sharedMockAxiosInstance.get.mockReset();
    sharedMockAxiosInstance.post.mockReset();
    sharedMockAxiosInstance.put.mockReset();
    sharedMockAxiosInstance.patch.mockReset();
    sharedMockAxiosInstance.delete.mockReset();
    sharedMockAxiosInstance.interceptors.request.use.mockReset();
    sharedMockAxiosInstance.interceptors.response.use.mockReset();

    (mockedAxios.create as jest.Mock).mockReturnValue(sharedMockAxiosInstance);
    process.env['NX_API_BASE_URL'] = 'http://localhost:3000/api';
  });

  it('updates payment and returns updated Payment on success', async () => {
    const payload: UpdatePaymentData = { description: 'Updated description' };
    const paymentId = 'pay_123';
    const mockPayment = {
      id: paymentId,
      userId: 'user_1',
      amount: 100,
      currency: 'USD',
      status: PaymentStatus.PROCESSING,
      type: PaymentType.INSTANT,
      description: 'Updated description',
      metadata: { note: 'test' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sharedMockAxiosInstance.put.mockResolvedValue({
      data: { success: true, data: mockPayment },
    });

    const result = await updatePaymentDetails(paymentId, payload);

    expect(sharedMockAxiosInstance.put).toHaveBeenCalledWith(
      `/payments/${paymentId}`,
      payload,
      undefined
    );
    expect(result).toEqual(mockPayment);
  });

  it('rejects with message when API responds with success=false', async () => {
    const paymentId = 'pay_123';
    const payload: UpdatePaymentData = { description: 'no-op' };

    sharedMockAxiosInstance.put.mockResolvedValue({
      data: { success: false, data: null, message: 'Invalid update' },
    });

    await expect(updatePaymentDetails(paymentId, payload)).rejects.toThrow(
      'Invalid update'
    );
  });

  it('rejects on network/axios error', async () => {
    const paymentId = 'pay_123';
    const payload: UpdatePaymentData = { description: 'any' };

    sharedMockAxiosInstance.put.mockRejectedValue(new Error('Network error'));

    await expect(updatePaymentDetails(paymentId, payload)).rejects.toThrow(
      'Network error'
    );
  });
});
