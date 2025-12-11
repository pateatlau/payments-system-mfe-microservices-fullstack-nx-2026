/**
 * useDashboardUpdates Hook
 *
 * Real-time dashboard updates via WebSocket
 * Tracks recent activity for admin monitoring
 */

import { useState, useCallback } from 'react';
import { useWebSocketSubscription } from 'shared-websocket';

export interface Activity {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
}

/**
 * Subscribe to real-time admin events
 * Maintains a list of recent activity
 */
export function useDashboardUpdates() {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  // Handle payment created event
  const handlePaymentCreated = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Payment created:', payload);

    setRecentActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'payment:created',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19), // Keep last 20 activities
    ]);
  }, []);

  // Handle payment updated event
  const handlePaymentUpdated = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Payment updated:', payload);

    setRecentActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'payment:updated',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Handle payment completed event
  const handlePaymentCompleted = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Payment completed:', payload);

    setRecentActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'payment:completed',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Handle payment failed event
  const handlePaymentFailed = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Payment failed:', payload);

    setRecentActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'payment:failed',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Handle audit created event
  const handleAuditCreated = useCallback((payload: unknown) => {
    console.log('[DashboardUpdates] Audit created:', payload);

    setRecentActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'admin:audit-created',
        data: payload,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Subscribe to WebSocket events
  useWebSocketSubscription('payment:created', handlePaymentCreated);
  useWebSocketSubscription('payment:updated', handlePaymentUpdated);
  useWebSocketSubscription('payment:completed', handlePaymentCompleted);
  useWebSocketSubscription('payment:failed', handlePaymentFailed);
  useWebSocketSubscription('admin:audit-created', handleAuditCreated);

  return { recentActivity };
}
