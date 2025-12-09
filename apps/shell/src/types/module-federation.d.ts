/**
 * Module Federation type declarations for remote modules
 */

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
