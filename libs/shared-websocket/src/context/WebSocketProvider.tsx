/**
 * WebSocket Context Provider
 *
 * Provides WebSocket client to React components via Context API
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { WebSocketClient } from '../lib/client';
import type { WebSocketClientConfig, ConnectionStatus } from '../lib/types';

interface WebSocketContextValue {
  client: WebSocketClient | null;
  status: ConnectionStatus;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  client: null,
  status: 'disconnected',
  isConnected: false,
});

export interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;
  token?: string;
  autoConnect?: boolean;
  debug?: boolean;
}

export function WebSocketProvider({
  children,
  url,
  token,
  autoConnect = true,
  debug = false,
}: WebSocketProviderProps): JSX.Element {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Create WebSocket client (only once)
  const client = useMemo(() => {
    const config: WebSocketClientConfig = {
      url,
      token,
      debug,
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pingInterval: 30000,
    };

    return new WebSocketClient(config);
  }, [url, token, debug]);

  // Connect/disconnect lifecycle
  useEffect(() => {
    // Listen for status changes
    const handleStatus = ({ status: newStatus }: { status: ConnectionStatus }) => {
      setStatus(newStatus);
    };

    client.on('status', handleStatus);

    // Auto-connect if enabled
    if (autoConnect) {
      client.connect();
    }

    // Cleanup on unmount
    return () => {
      client.off('status', handleStatus);
      client.disconnect();
    };
  }, [client, autoConnect]);

  const value = useMemo(
    () => ({
      client,
      status,
      isConnected: status === 'connected',
    }),
    [client, status]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context.client) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }

  return context;
}
