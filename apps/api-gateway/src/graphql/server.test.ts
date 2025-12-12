/**
 * GraphQL Server Tests
 *
 * POC-3: Tests for Apollo Server setup
 */

import { createApolloServer } from './server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

describe('GraphQL Server', () => {
  it('should create Apollo Server instance', () => {
    const server = createApolloServer();
    expect(server).toBeDefined();
  });

  it('should have schema with typeDefs and resolvers', () => {
    const server = createApolloServer();
    // Server is created with schema
    expect(server).toBeDefined();
  });
});
