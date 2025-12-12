/**
 * Apollo Server Setup
 *
 * POC-3: GraphQL server configuration
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  authDirectiveTransformer,
  adminDirectiveTransformer,
} from './directives';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { logger } from '../utils/logger';
import type { Express } from 'express';

/**
 * Create executable GraphQL schema with directives
 */
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apply directive transformers
const schemaWithDirectives = authDirectiveTransformer(
  adminDirectiveTransformer(schema)
);

/**
 * Create Apollo Server instance
 */
export function createApolloServer(): ApolloServer {
  return new ApolloServer({
    schema: schemaWithDirectives,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      // Logging plugin
      {
        requestDidStart() {
          return {
            didResolveOperation({
              request,
              operationName,
            }: {
              request: { query?: string };
              operationName?: string | null;
            }) {
              logger.info('GraphQL operation', {
                operationName,
                query: request.query,
              });
            },
            didEncounterErrors({ errors }: { errors: readonly Error[] }) {
              logger.error('GraphQL errors', {
                errors: errors.map((e: Error & { path?: unknown; extensions?: unknown }) => ({
                  message: e.message,
                  path: e.path,
                  extensions: e.extensions,
                })),
              });
            },
          };
        },
      },
    ],
  });
}

/**
 * Apply GraphQL middleware to Express app
 */
export async function applyGraphQLMiddleware(
  app: Express,
  apolloServer: ApolloServer
): Promise<void> {
  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        // Use optionalAuth middleware to extract user if token present
        // The directives will handle authentication requirements
        return createContext(req);
      },
    })
  );

  logger.info('GraphQL server started at /graphql');
}
