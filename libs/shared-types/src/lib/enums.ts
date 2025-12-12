/**
 * Enums
 *
 * Shared enums used across the application
 */

/**
 * User roles for Role-Based Access Control (RBAC)
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Payment type
 */
export enum PaymentType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
}
