/**
 * GraphQL Hooks for Payments
 *
 * POC-3: GraphQL queries and mutations for payments
 * Can be used alongside or instead of REST API
 *
 * Note: These hooks use Apollo Client hooks which require GraphQLProvider
 * to be set up in the component tree (already done in bootstrap.tsx)
 */

import {
  useQuery as useApolloQuery,
  useMutation as useApolloMutation,
} from '@apollo/client/react';
import {
  GET_PAYMENTS,
  GET_PAYMENT,
  CREATE_PAYMENT,
  UPDATE_PAYMENT,
  DELETE_PAYMENT,
} from '@payments-system/shared-graphql-client';
import type { Payment } from '../api/types';

/**
 * Hook to fetch payments using GraphQL
 */
export function usePaymentsGraphQL() {
  const { data, loading, error, refetch } = useApolloQuery(GET_PAYMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    payments:
      (data as { payments?: { edges?: Array<{ node: Payment }> } })?.payments?.edges?.map(
        (edge: { node: Payment }) => edge.node
      ) || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single payment using GraphQL
 */
export function usePaymentGraphQL(id: string | null) {
  const { data, loading, error, refetch } = useApolloQuery(GET_PAYMENT, {
    variables: { id: id || '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  return {
    payment: (data as { payment?: Payment })?.payment || null,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to create payment using GraphQL
 */
export function useCreatePaymentGraphQL() {
  const [createPayment, { loading, error }] = useApolloMutation(
    CREATE_PAYMENT,
    {
      refetchQueries: [{ query: GET_PAYMENTS }],
    }
  );

  return {
    createPayment: async (input: {
      amount: number;
      currency: string;
      type: string;
      description?: string;
      metadata?: unknown;
    }) => {
      const result = await createPayment({ variables: { input } });
      return (result.data as { createPayment?: Payment })?.createPayment;
    },
    loading,
    error,
  };
}

/**
 * Hook to update payment using GraphQL
 */
export function useUpdatePaymentGraphQL() {
  const [updatePayment, { loading, error }] = useApolloMutation(
    UPDATE_PAYMENT,
    {
      refetchQueries: [{ query: GET_PAYMENTS }],
    }
  );

  return {
    updatePayment: async (
      id: string,
      input: {
        status?: string;
        description?: string;
        metadata?: unknown;
      }
    ) => {
      const result = await updatePayment({ variables: { id, input } });
      return (result.data as { updatePayment?: Payment })?.updatePayment;
    },
    loading,
    error,
  };
}

/**
 * Hook to delete payment using GraphQL
 */
export function useDeletePaymentGraphQL() {
  const [deletePayment, { loading, error }] = useApolloMutation(
    DELETE_PAYMENT,
    {
      refetchQueries: [{ query: GET_PAYMENTS }],
    }
  );

  return {
    deletePayment: async (id: string) => {
      const result = await deletePayment({ variables: { id } });
      return (result.data as { deletePayment?: boolean })?.deletePayment || false;
    },
    loading,
    error,
  };
}
