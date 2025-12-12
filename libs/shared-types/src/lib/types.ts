/**
 * Legacy Types
 *
 * These types are kept for backward compatibility.
 * New code should use types from ./models, ./api, and ./enums
 */

// Re-export User from models for backward compatibility
export type { User } from './models/user';

// Re-export ApiResponse from api/common for backward compatibility
export type { ApiResponse } from './api/common';
