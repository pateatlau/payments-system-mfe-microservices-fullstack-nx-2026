/**
 * Admin Events
 *
 * Event definitions for administrative operations
 * Emitted by Admin MFE
 */

import { BaseEvent } from '../types';

/**
 * User data for admin events
 */
export interface AdminUserData {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
}

/**
 * Admin user created event payload
 * Emitted when an admin creates a new user
 */
export interface AdminUserCreatedPayload {
  user: AdminUserData;
  createdBy: string;
}

/**
 * Admin user updated event payload
 * Emitted when an admin updates a user
 */
export interface AdminUserUpdatedPayload {
  user: AdminUserData;
  updatedBy: string;
  changes: Record<string, { from: unknown; to: unknown }>;
}

/**
 * Admin user deleted event payload
 * Emitted when an admin deletes a user
 */
export interface AdminUserDeletedPayload {
  userId: string;
  deletedBy: string;
}

/**
 * Admin config updated event payload
 * Emitted when an admin updates system configuration
 */
export interface AdminConfigUpdatedPayload {
  key: string;
  value: unknown;
  updatedBy: string;
}

/**
 * Admin events union type
 */
export type AdminEvent =
  | (BaseEvent<AdminUserCreatedPayload> & { type: 'admin:user-created' })
  | (BaseEvent<AdminUserUpdatedPayload> & { type: 'admin:user-updated' })
  | (BaseEvent<AdminUserDeletedPayload> & { type: 'admin:user-deleted' })
  | (BaseEvent<AdminConfigUpdatedPayload> & { type: 'admin:config-updated' });

/**
 * Admin event type strings
 */
export type AdminEventType = AdminEvent['type'];
