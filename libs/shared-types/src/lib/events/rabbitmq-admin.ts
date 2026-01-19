/**
 * RabbitMQ Admin Event Types
 *
 * Event payload contracts for admin-related RabbitMQ events
 * Used by Admin Service (publisher) and Auth Service (subscriber)
 *
 * These are separate from frontend event bus types which serve
 * a different purpose (inter-MFE communication).
 */

/**
 * Payload for admin.user.deleted RabbitMQ event
 *
 * Published by Admin Service when an admin deletes a user.
 * Consumed by Auth Service to delete user from auth_db.
 */
export interface RabbitMQAdminUserDeletedPayload {
  /** ID of the deleted user */
  userId: string;
  /** ID or identifier of the admin who deleted the user */
  deletedBy: string;
  /** ISO timestamp of when the deletion occurred */
  deletedAt: string;
  /** Optional reason for deletion */
  reason?: string;
}

/**
 * Changes that can be made to a user via admin panel
 */
export interface AdminUserChanges {
  /** New role value if changed */
  role?: string;
  /** New name value if changed */
  name?: string;
  /** New email value if changed */
  email?: string;
}

/**
 * Payload for admin.user.updated RabbitMQ event
 *
 * Published by Admin Service when an admin updates a user.
 * Consumed by Auth Service to update user in auth_db and invalidate cache.
 */
export interface RabbitMQAdminUserUpdatedPayload {
  /** ID of the updated user */
  userId: string;
  /** ID or identifier of the admin who made the update */
  updatedBy: string;
  /** ISO timestamp of when the update occurred */
  updatedAt: string;
  /** Object containing the changed fields and their new values */
  changes: AdminUserChanges;
}
