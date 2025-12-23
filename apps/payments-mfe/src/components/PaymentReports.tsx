import { useMemo, useState } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { PaymentStatus } from 'shared-types';
import { usePaymentReports } from '../hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Loading,
  Alert,
  AlertTitle,
  AlertDescription,
  Label,
  Button,
} from '@mfe/shared-design-system';

function percent(n: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((n / total) * 100);
}

function titleCase(s: string): string {
  return s.replace(/(^|_|-)([a-z])/g, (_, __, c) => c.toUpperCase());
}

export function PaymentReports() {
  const { user } = useAuthStore();

  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data, isLoading, isError, error, refetch } = usePaymentReports({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const totalPayments = data?.totalPayments ?? 0;
  const totalAmount = data?.totalAmount ?? 0;
  const byStatus = data?.byStatus ?? {};
  const byType = data?.byType ?? {};

  // Derived metrics
  const completedCount =
    byStatus[PaymentStatus.COMPLETED] ?? byStatus['completed'] ?? 0;
  const successRate = percent(completedCount, totalPayments);
  const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

  // Simple responsive bar component using divs
  const StatusBars = useMemo(() => {
    const entries = Object.entries(byStatus);
    if (entries.length === 0)
      return <p className="text-sm text-muted-foreground">No status data</p>;
    return (
      <div className="space-y-2" role="list" aria-label="Payments by status">
        {entries.map(([status, count]) => (
          <div key={status} role="listitem" className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize">{status}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${percent(count, totalPayments)}%` }}
                aria-label={`${titleCase(status)} ${percent(count, totalPayments)}%`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }, [byStatus, totalPayments]);

  const TypeBars = useMemo(() => {
    const entries = Object.entries(byType);
    if (entries.length === 0)
      return <p className="text-sm text-muted-foreground">No type data</p>;
    return (
      <div className="space-y-2" role="list" aria-label="Payments by type">
        {entries.map(([type, count]) => (
          <div key={type} role="listitem" className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize">{type}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded">
              <div
                className="h-2 bg-green-600 rounded"
                style={{ width: `${percent(count, totalPayments)}%` }}
                aria-label={`${titleCase(type)} ${percent(count, totalPayments)}%`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }, [byType, totalPayments]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loading label="Loading payment reports..." />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Reports</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : 'An unexpected error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  // Role-based check (defensive, page should guard already)
  if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
    return (
      <Alert variant="warning">
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          Reports are available to vendors and admins only.
        </AlertDescription>
      </Alert>
    );
  }

  if (totalPayments === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No reports yet</CardTitle>
          <CardDescription>
            Reports will appear after you create payments in this period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Create or receive payments, then refresh to see metrics.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Refresh reports
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Reports</CardTitle>
          <CardDescription>
            Overview of payments within the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="startDate">Start date</Label>
              <input
                id="startDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                aria-label="Start date"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="endDate">End date</Label>
              <input
                id="endDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                aria-label="End date"
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <Button onClick={() => refetch()}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p aria-label="Total payments" className="text-2xl font-bold">
              {totalPayments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p aria-label="Total amount" className="text-2xl font-bold">
              {totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p aria-label="Success rate" className="text-2xl font-bold">
              {successRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p aria-label="Average amount" className="text-2xl font-bold">
              {averageAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>
              Distribution of payments by status.
            </CardDescription>
          </CardHeader>
          <CardContent>{StatusBars}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By Type</CardTitle>
            <CardDescription>Distribution of payments by type.</CardDescription>
          </CardHeader>
          <CardContent>{TypeBars}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentReports;
