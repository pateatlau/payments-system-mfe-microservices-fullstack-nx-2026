/**
 * GraphQL Resolvers Tests
 *
 * POC-3: Tests for GraphQL resolvers
 */

import { resolvers } from './index';
import type { GraphQLContext } from '../context';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GraphQL Resolvers', () => {
  const mockContext: GraphQLContext = {
    user: {
      userId: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    },
    token: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Resolvers', () => {
    describe('me', () => {
      it('should return current user', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        };

        mockedAxios.create = jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            data: {
              data: {
                user: mockUser,
              },
            },
          }),
        });

        const result = await resolvers.Query?.me?.(
          {},
          {},
          mockContext,
          {} as any
        );

        expect(result).toEqual(mockUser);
      });
    });

    describe('payment', () => {
      it('should return payment by id', async () => {
        const mockPayment = {
          id: 'pay-1',
          userId: 'user-1',
          amount: 100.0,
          currency: 'USD',
          status: 'PENDING',
        };

        mockedAxios.create = jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            data: {
              data: mockPayment,
            },
          }),
        });

        const result = await resolvers.Query?.payment?.(
          {},
          { id: 'pay-1' },
          mockContext,
          {} as any
        );

        expect(result).toEqual(mockPayment);
      });

      it('should return null if payment not found', async () => {
        mockedAxios.create = jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue({
            response: { status: 404 },
            isAxiosError: true,
          }),
        });

        const result = await resolvers.Query?.payment?.(
          {},
          { id: 'pay-999' },
          mockContext,
          {} as any
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('Mutation Resolvers', () => {
    describe('login', () => {
      it('should login user', async () => {
        const mockAuthResponse = {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '15m',
        };

        mockedAxios.create = jest.fn().mockReturnValue({
          post: jest.fn().mockResolvedValue({
            data: {
              data: mockAuthResponse,
            },
          }),
        });

        const result = await resolvers.Mutation?.login?.(
          {},
          {
            input: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          {} as GraphQLContext,
          {} as any
        );

        expect(result).toEqual(mockAuthResponse);
      });
    });

    describe('createPayment', () => {
      it('should create payment', async () => {
        const mockPayment = {
          id: 'pay-1',
          userId: 'user-1',
          amount: 100.0,
          currency: 'USD',
          status: 'PENDING',
        };

        mockedAxios.create = jest.fn().mockReturnValue({
          post: jest.fn().mockResolvedValue({
            data: {
              data: mockPayment,
            },
          }),
        });

        const result = await resolvers.Mutation?.createPayment?.(
          {},
          {
            input: {
              amount: 100.0,
              currency: 'USD',
              type: 'PAYMENT',
              description: 'Test payment',
            },
          },
          mockContext,
          {} as any
        );

        expect(result).toEqual(mockPayment);
      });
    });
  });
});
