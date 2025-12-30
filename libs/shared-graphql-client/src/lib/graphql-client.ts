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
  type ErrorLike,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';

export interface GraphQLClientConfig {
  uri: string;
  getAccessToken?: () => string | null;
  onError?: (error: Error) => void;
}

/**
 * Create Apollo Client instance
 */
export function createGraphQLClient(config: GraphQLClientConfig): ApolloClient {
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

  // Helper to convert ErrorLike to Error
  const toError = (errorLike: ErrorLike): Error => {
    if (errorLike instanceof Error) {
      return errorLike;
    }
    // ErrorLike has message property
    return new Error(errorLike.message);
  };

  // Error link - handle errors
  const errorLink = new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      // Handle GraphQL errors
      error.errors.forEach((err) => {
        console.error(
          `[GraphQL error]: Message: ${err.message}, Location: ${JSON.stringify(err.locations)}, Path: ${err.path}`
        );

        // Handle authentication errors
        if (err.extensions?.code === 'UNAUTHENTICATED') {
          // Token expired or invalid - could trigger token refresh
          onErrorCallback?.(new Error('Authentication required'));
        }

        // Handle authorization errors
        if (err.extensions?.code === 'FORBIDDEN') {
          onErrorCallback?.(new Error('Access denied'));
        }
      });
    } else {
      // Handle network errors - error is ErrorLike (has message property)
      console.error(`[Network error]: ${error.message}`);
      onErrorCallback?.(toError(error));
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
              merge(_existing: unknown, incoming: unknown) {
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
let defaultClient: ApolloClient | null = null;

/**
 * Initialize default GraphQL client
 */
export function initGraphQLClient(config: GraphQLClientConfig): void {
  defaultClient = createGraphQLClient(config);
}

/**
 * Get default GraphQL client
 */
export function getGraphQLClient(): ApolloClient {
  if (!defaultClient) {
    throw new Error(
      'GraphQL client not initialized. Call initGraphQLClient() first.'
    );
  }
  return defaultClient;
}
