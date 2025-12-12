/**
 * Shared GraphQL Client Library
 *
 * POC-3: GraphQL client for frontend applications
 */

export {
  createGraphQLClient,
  initGraphQLClient,
  getGraphQLClient,
} from './lib/graphql-client';
export type { GraphQLClientConfig } from './lib/graphql-client';
export { GraphQLProvider } from './lib/graphql-provider';
export type { GraphQLProviderProps } from './lib/graphql-provider';
export * from './lib/queries';
export * from './lib/mutations';
