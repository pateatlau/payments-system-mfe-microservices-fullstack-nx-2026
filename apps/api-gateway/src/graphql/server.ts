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
import type { Express, Request, Response } from 'express';
import type { JwtPayload } from '../middleware/auth';

/**
 * Create executable GraphQL schema with directives
 *
 * Note: We use assumeValidSDL: true because:
 * 1. Custom directives (@auth, @admin) are declared in the schema
 * 2. The directive transformers process them AFTER schema creation
 * 3. Without this option, makeExecutableSchema validates SDL and fails
 *    because it doesn't know how to execute the custom directives
 */
function createSchema() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    // Skip SDL validation for custom directives
    // The directives are declared but implemented via transformers
    assumeValidSDL: true,
  });

  // Apply directive transformers in order:
  // 1. First adminDirectiveTransformer (requires auth + admin role)
  // 2. Then authDirectiveTransformer (requires authentication)
  return authDirectiveTransformer(adminDirectiveTransformer(schema));
}

/**
 * Create Apollo Server instance
 */
export function createApolloServer(): ApolloServer {
  const schemaWithDirectives = createSchema();

  return new ApolloServer({
    schema: schemaWithDirectives,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      // Logging plugin
      {
        requestDidStart: async () => {
          return {
            didResolveOperation: async ({
              request,
              operationName,
            }: {
              request: { query?: string };
              operationName?: string | null;
            }) => {
              logger.info('GraphQL operation', {
                operationName,
                query: request.query,
              });
            },
            didEncounterErrors: async ({
              errors,
            }: {
              errors: readonly Error[];
            }) => {
              logger.error('GraphQL errors', {
                errors: errors.map(
                  (e: Error & { path?: unknown; extensions?: unknown }) => ({
                    message: e.message,
                    path: e.path,
                    extensions: e.extensions,
                  })
                ),
              });
            },
          };
        },
      } as Parameters<typeof ApolloServer.prototype.addPlugin>[0],
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

  // Return helpful info for GET requests (browser navigation)
  app.get('/graphql', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'GraphQL endpoint - use POST requests with JSON body',
      endpoint: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <token> (for authenticated queries)',
      },
      exampleQuery: {
        query: '{ health { status timestamp service } }',
      },
      tools: {
        'Apollo Studio': 'https://studio.apollographql.com/sandbox/explorer',
        'Postman': 'Import from /api-docs.json',
        'curl': 'curl -X POST https://localhost/graphql -H "Content-Type: application/json" -d \'{"query":"{ health { status } }"}\'',
      },
    });
  });

  // Handle POST requests with GraphQL middleware
  app.post(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({
        req,
      }: {
        req: {
          headers: Record<string, string | string[] | undefined>;
          user?: JwtPayload;
        };
      }) => {
        // Use optionalAuth middleware to extract user if token present
        // The directives will handle authentication requirements
        return createContext(req);
      },
    }) as Parameters<typeof app.use>[1]
  );

  logger.info('GraphQL server started at /graphql');
}
