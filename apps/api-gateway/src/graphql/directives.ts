/**
 * GraphQL Directives
 *
 * Custom directives for authentication and authorization
 */

import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { GraphQLSchema, defaultFieldResolver, GraphQLError } from 'graphql';
import type { GraphQLContext } from './context';

/**
 * @auth directive - Requires authentication
 */
export function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, _typeName) => {
      const authDirective = (getDirective as (schema: GraphQLSchema, node: unknown, directiveName: string) => unknown[] | undefined)(
        schema,
        fieldConfig,
        'auth'
      )?.[0];
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async (
          source,
          args,
          context: GraphQLContext,
          info
        ) => {
          if (!context.user) {
            throw new GraphQLError('Authentication required', {
              extensions: { code: 'UNAUTHENTICATED', status: 401 },
            });
          }
          return resolve(source, args, context, info);
        };
      }
      return fieldConfig;
    },
  });
}

/**
 * @admin directive - Requires ADMIN role
 */
export function adminDirectiveTransformer(
  schema: GraphQLSchema
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, _typeName) => {
      const adminDirective = (getDirective as (schema: GraphQLSchema, node: unknown, directiveName: string) => unknown[] | undefined)(
        schema,
        fieldConfig,
        'admin'
      )?.[0];
      if (adminDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async (
          source,
          args,
          context: GraphQLContext,
          info
        ) => {
          if (!context.user) {
            throw new GraphQLError('Authentication required', {
              extensions: { code: 'UNAUTHENTICATED', status: 401 },
            });
          }
          if (context.user.role !== 'ADMIN') {
            throw new GraphQLError('Admin access required', {
              extensions: { code: 'FORBIDDEN', status: 403 },
            });
          }
          return resolve(source, args, context, info);
        };
      }
      return fieldConfig;
    },
  });
}
