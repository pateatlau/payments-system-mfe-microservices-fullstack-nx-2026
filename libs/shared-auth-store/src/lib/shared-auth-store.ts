import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User roles for Role-Based Access Control (RBAC)
 */
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Sign-up data interface
 */
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Auth state interface
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignUpData) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
}

/**
 * Mock authentication function for POC-1
 * In POC-2, this will be replaced with real backend authentication
 */
async function mockLogin(
  email: string,
  _password: string
): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock authentication - accept any email/password combination
  // In production, this would validate against a backend
  const role: UserRole =
    email.includes('admin') ? 'ADMIN' :
    email.includes('vendor') ? 'VENDOR' :
    'CUSTOMER';

  return {
    id: `user-${Date.now()}`,
    email,
    name: email.split('@')[0] ?? 'User',
    role,
  };
}

/**
 * Mock sign-up function for POC-1
 * In POC-2, this will be replaced with real backend sign-up
 */
async function mockSignUp(data: SignUpData): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock sign-up - create user with provided data
  // In production, this would create a user in the backend
  const role: UserRole = (data.role ?? 'CUSTOMER') as UserRole;

  return {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role,
  };
}

/**
 * Zustand auth store with persistence middleware
 * Uses localStorage to persist auth state across page reloads
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await mockLogin(email, password);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      signup: async (data: SignUpData) => {
        set({ isLoading: true, error: null });
        try {
          const user = await mockSignUp(data);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Sign-up failed',
          });
        }
      },

      hasRole: (role: UserRole): boolean => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles: UserRole[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
