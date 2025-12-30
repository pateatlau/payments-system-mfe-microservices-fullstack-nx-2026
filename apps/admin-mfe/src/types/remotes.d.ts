/**
 * Type declarations for remote MFEs consumed by admin-mfe
 *
 * This file contains type declarations for remote modules loaded via Module Federation.
 * These declarations help TypeScript understand the shape of the remote modules.
 */

declare module 'paymentsMfe/PaymentReports' {
  import { ComponentType } from 'react';
  /**
   * PaymentReports component from the Payments MFE
   */
  const PaymentReports: ComponentType;
  export default PaymentReports;
}
