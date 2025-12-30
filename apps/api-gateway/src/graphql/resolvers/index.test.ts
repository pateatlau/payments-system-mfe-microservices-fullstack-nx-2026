/**
 * GraphQL Resolvers Tests
 *
 * POC-3: Tests for GraphQL resolvers
 */

import type { GraphQLContext } from '../context';
import axios from 'axios';
import type { GraphQLResolveInfo } from 'graphql';

// Create mock axios instance methods
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

// Mock axios before importing resolvers
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: jest.fn(() => ({
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        delete: mockDelete,
      })),
      isAxiosError: jest.fn((error: unknown) => {
        return error !== null && typeof error === 'object' && 'isAxiosError' in error;
      }),
    },
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      delete: mockDelete,
    })),
    isAxiosError: jest.fn((error: unknown) => {
      return error !== null && typeof error === 'object' && 'isAxiosError' in error;
    }),
  };
});

// Import resolvers after axios is mocked
import { resolvers } from './index';

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
    // Ensure isAxiosError is set up in each test
    mockedAxios.isAxiosError = jest.fn((error: unknown) => {
      return error !== null && typeof error === 'object' && 'isAxiosError' in error;
    });
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

        mockGet.mockResolvedValue({
          data: {
            data: {
              user: mockUser,
            },
          },
        });

        const result = await resolvers.Query?.me?.(
          {},
          {},
          mockContext,
          {} as GraphQLResolveInfo
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

        mockGet.mockResolvedValue({
          data: {
            data: mockPayment,
          },
        });

        const result = await resolvers.Query?.payment?.(
          {},
          { id: 'pay-1' },
          mockContext,
          {} as GraphQLResolveInfo
        );

        expect(result).toEqual(mockPayment);
      });

      it('should return null if payment not found', async () => {
        mockGet.mockRejectedValue({
          response: { status: 404 },
          isAxiosError: true,
        });

        const result = await resolvers.Query?.payment?.(
          {},
          { id: 'pay-999' },
          mockContext,
          {} as GraphQLResolveInfo
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

        mockPost.mockResolvedValue({
          data: {
            data: mockAuthResponse,
          },
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
          {} as GraphQLResolveInfo
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

        mockPost.mockResolvedValue({
          data: {
            data: mockPayment,
          },
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
          {} as GraphQLResolveInfo
        );

        expect(result).toEqual(mockPayment);
      });
    });
  });
});
