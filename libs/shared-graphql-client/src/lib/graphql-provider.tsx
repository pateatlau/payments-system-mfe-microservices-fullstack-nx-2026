/**
 * GraphQL Provider
 *
 * POC-3: React provider for Apollo Client
 */

import { ApolloProvider } from '@apollo/client';
import type { ReactNode } from 'react';
import type { ApolloClient } from '@apollo/client';

export interface GraphQLProviderProps {
  client: ApolloClient<unknown>;
  children: ReactNode;
}

/**
 * GraphQL Provider component
 * Wraps app with Apollo Provider
 */
export function GraphQLProvider({
  client,
  children,
}: GraphQLProviderProps): JSX.Element {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
