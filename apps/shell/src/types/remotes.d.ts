/**
 * Type declarations for remote MFEs
 *
 * This file contains type declarations for remote modules loaded via Module Federation.
 * These declarations help TypeScript understand the shape of the remote modules.
 */

declare module 'profileMfe/ProfilePage' {
  import { ComponentType } from 'react';
  /**
   * ProfilePage component from the Profile MFE
   */
  const ProfilePage: ComponentType;
  export default ProfilePage;
}

// Add declarations for other remotes as needed
declare module 'authMfe/SignIn' {
  import { ComponentType } from 'react';
  const SignIn: ComponentType;
  export default SignIn;
}

declare module 'authMfe/SignUp' {
  import { ComponentType } from 'react';
  const SignUp: ComponentType;
  export default SignUp;
}

declare module 'paymentsMfe/PaymentsPage' {
  import { ComponentType } from 'react';
  const PaymentsPage: ComponentType;
  export default PaymentsPage;
}

declare module 'paymentsMfe/ReportsPage' {
  import { ComponentType } from 'react';
  const ReportsPage: ComponentType;
  export default ReportsPage;
}

declare module 'adminMfe/AdminDashboard' {
  import { ComponentType } from 'react';
  const AdminDashboard: ComponentType;
  export default AdminDashboard;
}
