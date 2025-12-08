/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Restricts access based on user roles
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from 'shared-types';
import { ApiError } from './errorHandler';

/**
 * Require specific role(s) middleware factory
 *
 * @param roles - Single role or array of allowed roles
 * @returns Middleware function
 *
 * @example
 * ```ts
 * router.get('/admin', requireRole('ADMIN'), handler);
 * router.get('/vendor-or-admin', requireRole(['VENDOR', 'ADMIN']), handler);
 * ```
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, _res: Response, next: NextFunction) => {
    // User must be authenticated (authenticate middleware should run first)
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }

    next();
  };
};

/**
 * Require admin role
 * Shorthand for requireRole('ADMIN')
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Require customer role
 * Shorthand for requireRole('CUSTOMER')
 */
export const requireCustomer = requireRole(UserRole.CUSTOMER);

/**
 * Require vendor role
 * Shorthand for requireRole('VENDOR')
 */
export const requireVendor = requireRole(UserRole.VENDOR);
