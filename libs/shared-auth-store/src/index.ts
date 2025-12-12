export * from './lib/shared-auth-store';
export type { SignUpData, AuthState } from './lib/shared-auth-store';
// Re-export User and UserRole from shared-types for convenience
export type { User, UserRole } from 'shared-types';
export { useAuthStore } from './lib/shared-auth-store';
