/**
 * Module Federation type declarations for remote modules
 */

/**
 * HMR (Hot Module Replacement) type declarations
 * Required for TypeScript to recognize module.hot
 */
interface ImportMeta {
  hot?: {
    accept(callback?: () => void): void;
    accept(dep: string, callback: () => void): void;
    accept(deps: string[], callback: () => void): void;
    dispose(callback: (data: unknown) => void): void;
    invalidate(): void;
    data: unknown;
  };
}

declare const module: {
  hot?: {
    accept(callback?: () => void): void;
    accept(dep: string, callback: () => void): void;
    accept(deps: string[], callback: (updatedDeps: unknown[]) => void): void;
    dispose(callback: (data: unknown) => void): void;
    invalidate(): void;
    data: unknown;
  };
};

declare module 'authMfe/SignIn' {
  interface SignInProps {
    onSuccess?: () => void;
    onNavigateToSignUp?: () => void;
  }
  const SignIn: React.ComponentType<SignInProps>;
  export default SignIn;
}

declare module 'authMfe/SignUp' {
  interface SignUpProps {
    onSuccess?: () => void;
    onNavigateToSignIn?: () => void;
  }
  const SignUp: React.ComponentType<SignUpProps>;
  export default SignUp;
}

declare module 'paymentsMfe/PaymentsPage' {
  interface PaymentsPageProps {
    onPaymentSuccess?: () => void;
  }
  const PaymentsPage: React.ComponentType<PaymentsPageProps>;
  export default PaymentsPage;
}

declare module 'adminMfe/AdminDashboard' {
  interface AdminDashboardProps {
    // Admin dashboard props (can be extended as needed)
  }
  const AdminDashboard: React.ComponentType<AdminDashboardProps>;
  export default AdminDashboard;
}
