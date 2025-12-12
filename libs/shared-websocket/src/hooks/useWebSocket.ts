/**
 * useWebSocket Hook
 *
 * Main hook for accessing WebSocket client
 */

import { useWebSocketContext } from '../context/WebSocketProvider';
import type { WebSocketClient } from '../lib/client';
import type { ConnectionStatus } from '../lib/types';

export interface UseWebSocketReturn {
  client: WebSocketClient;
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook to access WebSocket client
 */
export function useWebSocket(): UseWebSocketReturn {
  const { client, status, isConnected } = useWebSocketContext();

  if (!client) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  return {
    client,
    status,
    isConnected,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
  };
}
