/**
 * GraphQL Resolvers
 *
 * POC-3: GraphQL resolvers that proxy to backend services
 */

import { GraphQLError } from 'graphql';
import axios, { AxiosInstance } from 'axios';
import type { Resolvers } from '../types/generated';
import type { GraphQLContext } from '../context';

// Create API clients for backend services
const authClient: AxiosInstance = axios.create({
  baseURL: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
  timeout: 30000,
});

const paymentsClient: AxiosInstance = axios.create({
  baseURL: `http://localhost:${process.env.PAYMENTS_SERVICE_PORT || 3002}`,
  timeout: 30000,
});

const adminClient: AxiosInstance = axios.create({
  baseURL: `http://localhost:${process.env.ADMIN_SERVICE_PORT || 3003}`,
  timeout: 30000,
});

const profileClient: AxiosInstance = axios.create({
  baseURL: `http://localhost:${process.env.PROFILE_SERVICE_PORT || 3004}`,
  timeout: 30000,
});

/**
 * Helper to add auth headers to requests
 */
function getAuthHeaders(context: GraphQLContext): Record<string, string> {
  if (!context.user) {
    return {};
  }
  return {
    Authorization: `Bearer ${context.token}`,
  };
}

/**
 * Helper to handle API errors
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'Internal server error';
    throw new GraphQLError(message, {
      extensions: {
        code: error.response?.data?.error?.code || 'INTERNAL_ERROR',
        status,
      },
    });
  }
  throw new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_ERROR', status: 500 },
  });
}

export const resolvers: Resolvers<GraphQLContext> = {
  // Scalars
  DateTime: {
    parseValue: (value: unknown) => {
      if (typeof value === 'string') {
        return new Date(value);
      }
      return value;
    },
    serialize: (value: unknown) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
  },

  JSON: {
    parseValue: (value: unknown) => value,
    serialize: (value: unknown) => value,
  },

  // Query Resolvers
  Query: {
    // Auth Queries
    me: async (_parent, _args, context) => {
      try {
        const response = await authClient.get('/auth/me', {
          headers: getAuthHeaders(context),
        });
        return response.data.data.user;
      } catch (error) {
        handleApiError(error);
      }
    },

    // Payment Queries
    payment: async (_parent, { id }, context) => {
      try {
        const response = await paymentsClient.get(`/payments/${id}`, {
          headers: getAuthHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        handleApiError(error);
      }
    },

    payments: async (_parent, { input }, context) => {
      try {
        const params = new URLSearchParams();
        if (input?.first) {
          params.append('limit', input.first.toString());
        }
        if (input?.after) {
          params.append('cursor', input.after);
        }

        const response = await paymentsClient.get('/payments', {
          params: Object.fromEntries(params),
          headers: getAuthHeaders(context),
        });

        const payments = response.data.data || [];
        const edges = payments.map((payment: unknown, index: number) => ({
          node: payment,
          cursor: `cursor-${index}`,
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage: payments.length === (input?.first || 10),
            hasPreviousPage: false,
            startCursor: edges[0]?.cursor || null,
            endCursor: edges[edges.length - 1]?.cursor || null,
          },
          totalCount: payments.length,
        };
      } catch (error) {
        handleApiError(error);
      }
    },

    // Profile Queries
    profile: async (_parent, _args, context) => {
      try {
        const response = await profileClient.get('/profile', {
          headers: getAuthHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        handleApiError(error);
      }
    },

    // Admin Queries
    users: async (_parent, { input }, context) => {
      try {
        const params = new URLSearchParams();
        if (input?.first) {
          params.append('limit', input.first.toString());
        }

        const response = await adminClient.get('/admin/users', {
          params: Object.fromEntries(params),
          headers: getAuthHeaders(context),
        });
        return response.data.data || [];
      } catch (error) {
        handleApiError(error);
      }
    },

    user: async (_parent, { id }, context) => {
      try {
        const response = await adminClient.get(`/admin/users/${id}`, {
          headers: getAuthHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        handleApiError(error);
      }
    },

    auditLogs: async (_parent, { input }, context) => {
      try {
        const params = new URLSearchParams();
        if (input?.first) {
          params.append('limit', input.first.toString());
        }

        const response = await adminClient.get('/admin/audit-logs', {
          params: Object.fromEntries(params),
          headers: getAuthHeaders(context),
        });
        return response.data.data || [];
      } catch (error) {
        handleApiError(error);
      }
    },

    systemConfig: async (_parent, { key }, context) => {
      try {
        const response = await adminClient.get(`/admin/config/${key}`, {
          headers: getAuthHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        handleApiError(error);
      }
    },
  },

  // Mutation Resolvers
  Mutation: {
    // Auth Mutations
    login: async (_parent, { input }) => {
      try {
        const response = await authClient.post('/auth/login', {
          email: input.email,
          password: input.password,
        });
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    register: async (_parent, { input }) => {
      try {
        const response = await authClient.post('/auth/register', {
          email: input.email,
          password: input.password,
          name: input.name,
        });
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    logout: async (_parent, _args, context) => {
      try {
        await authClient.post(
          '/auth/logout',
          {},
          {
            headers: getAuthHeaders(context),
          }
        );
        return true;
      } catch (error) {
        handleApiError(error);
      }
    },

    refreshToken: async (_parent, { refreshToken: token }) => {
      try {
        const response = await authClient.post('/auth/refresh', {
          refreshToken: token,
        });
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    // Payment Mutations
    createPayment: async (_parent, { input }, context) => {
      try {
        const response = await paymentsClient.post(
          '/payments',
          {
            amount: input.amount,
            currency: input.currency,
            type: input.type,
            description: input.description,
            metadata: input.metadata,
          },
          {
            headers: getAuthHeaders(context),
          }
        );
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    updatePayment: async (_parent, { id, input }, context) => {
      try {
        const response = await paymentsClient.patch(
          `/payments/${id}`,
          {
            status: input.status,
            description: input.description,
            metadata: input.metadata,
          },
          {
            headers: getAuthHeaders(context),
          }
        );
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    deletePayment: async (_parent, { id }, context) => {
      try {
        await paymentsClient.delete(`/payments/${id}`, {
          headers: getAuthHeaders(context),
        });
        return true;
      } catch (error) {
        handleApiError(error);
      }
    },

    // Profile Mutations
    updateProfile: async (_parent, { input }, context) => {
      try {
        const response = await profileClient.put(
          '/profile',
          {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            address: input.address,
            city: input.city,
            country: input.country,
            avatar: input.avatar,
            preferences: input.preferences,
          },
          {
            headers: getAuthHeaders(context),
          }
        );
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    // Admin Mutations
    updateUserRole: async (_parent, { id, role }, context) => {
      try {
        const response = await adminClient.put(
          `/admin/users/${id}/role`,
          { role },
          {
            headers: getAuthHeaders(context),
          }
        );
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    updateSystemConfig: async (_parent, { key, value }, context) => {
      try {
        const response = await adminClient.put(
          `/admin/config/${key}`,
          { value },
          {
            headers: getAuthHeaders(context),
          }
        );
        return response.data.data;
      } catch (error) {
        handleApiError(error);
      }
    },
  },

  // Subscription Resolvers (placeholder - would use WebSocket in production)
  Subscription: {
    paymentUpdated: {
      subscribe: () => {
        // Placeholder - would integrate with WebSocket in production
        throw new GraphQLError('Subscriptions not yet implemented', {
          extensions: { code: 'NOT_IMPLEMENTED' },
        });
      },
    },
    userUpdated: {
      subscribe: () => {
        // Placeholder - would integrate with WebSocket in production
        throw new GraphQLError('Subscriptions not yet implemented', {
          extensions: { code: 'NOT_IMPLEMENTED' },
        });
      },
    },
  },
};
