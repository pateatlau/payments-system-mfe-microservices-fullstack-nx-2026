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

