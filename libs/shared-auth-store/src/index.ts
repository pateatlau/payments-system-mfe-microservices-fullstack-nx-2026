export * from './lib/shared-auth-store';
export type {
  UserRole,
  SignUpData,
  AuthState,
} from './lib/shared-auth-store';
// Re-export User from shared-types for convenience
export type { User } from 'shared-types';
export { useAuthStore } from './lib/shared-auth-store';
