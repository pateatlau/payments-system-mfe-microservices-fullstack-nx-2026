/**
 * Mock PaymentReports component for testing
 * Used when the remote module from payments-mfe is not available
 */
export default function PaymentReports() {
  return (
    <div data-testid="payment-reports-mock">Payment Reports Component</div>
  );
}
