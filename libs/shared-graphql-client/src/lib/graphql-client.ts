/**
 * GraphQL Client
 *
 * POC-3: Apollo Client setup for GraphQL queries and mutations
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  type ApolloClient as ApolloClientType,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError, type ErrorLink } from '@apollo/client/link/error';

export interface GraphQLClientConfig {
  uri: string;
  getAccessToken?: () => string | null;
  onError?: (error: Error) => void;
}

/**
 * Create Apollo Client instance
 */
export function createGraphQLClient(
  config: GraphQLClientConfig
): ApolloClientType<unknown> {
  const { uri, getAccessToken, onError: onErrorCallback } = config;

  // HTTP link
  const httpLink = createHttpLink({
    uri,
    credentials: 'include',
  });

  // Auth link - add JWT token to requests
  const authLink = setContext((_, { headers }) => {
    const token = getAccessToken?.();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  // Error link - handle errors
  const errorLink: ErrorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(error => {
        const message = error.message;
        const locations = error.locations;
        const path = error.path;
        const extensions = error.extensions;

        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );

        // Handle authentication errors
        if (
          extensions &&
          typeof extensions === 'object' &&
          'code' in extensions &&
          extensions.code === 'UNAUTHENTICATED'
        ) {
          // Token expired or invalid - could trigger token refresh
          onErrorCallback?.(new Error('Authentication required'));
        }

        // Handle authorization errors
        if (
          extensions &&
          typeof extensions === 'object' &&
          'code' in extensions &&
          extensions.code === 'FORBIDDEN'
        ) {
          onErrorCallback?.(new Error('Access denied'));
        }
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      onErrorCallback?.(networkError);
    }
  });

  // Create Apollo Client
  const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            payments: {
              merge(existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });

  return client;
}

/**
 * Default GraphQL client instance
 * Should be configured with provider in app
 */
let defaultClient: ApolloClientType<unknown> | null = null;

/**
 * Initialize default GraphQL client
 */
export function initGraphQLClient(config: GraphQLClientConfig): void {
  defaultClient = createGraphQLClient(config);
}

/**
 * Get default GraphQL client
 */
export function getGraphQLClient(): ApolloClientType<unknown> {
  if (!defaultClient) {
    throw new Error(
      'GraphQL client not initialized. Call initGraphQLClient() first.'
    );
  }
  return defaultClient;
}
