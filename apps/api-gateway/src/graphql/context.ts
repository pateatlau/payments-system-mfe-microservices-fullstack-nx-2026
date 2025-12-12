/**
 * GraphQL Context
 *
 * Provides request context including authenticated user
 */

import type { JwtPayload } from '../middleware/auth';

export interface GraphQLContext {
  user?: JwtPayload;
  token?: string;
}

/**
 * Create GraphQL context from Express request
 */
export function createContext(req: {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtPayload;
}): GraphQLContext {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token =
    authHeader && typeof authHeader === 'string'
      ? authHeader.replace('Bearer ', '')
      : undefined;

  return {
    user: req.user,
    token,
  };
}
