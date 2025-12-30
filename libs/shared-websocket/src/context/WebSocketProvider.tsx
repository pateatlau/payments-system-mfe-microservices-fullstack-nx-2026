/**
 * WebSocket Context Provider
 *
 * Provides WebSocket client to React components via Context API
 *
 * Note: This provider handles React StrictMode's double-mount behavior
 * by using a ref to track mount state and prevent premature disconnection.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  // Track if the component is mounted - helps handle React StrictMode's double-mount
  const isMountedRef = useRef(false);
  // Track the connection timeout to cancel it on unmount
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create WebSocket client
  // Recreates when url, token, or debug changes to ensure proper authentication
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
  // Uses a small delay to handle React StrictMode's immediate unmount/remount
  useEffect(() => {
    isMountedRef.current = true;

    // Listen for status changes
    const handleStatus = ({
      status: newStatus,
    }: {
      status: ConnectionStatus;
    }) => {
      if (isMountedRef.current) {
        setStatus(newStatus);
      }
    };

    client.on('status', handleStatus);

    // Auto-connect if enabled and token is available
    // Use a small delay to avoid connecting during StrictMode's first mount
    // which gets immediately unmounted
    if (autoConnect && token) {
      connectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          client.connect();
        }
      }, 50);
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;

      // Cancel pending connection
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }

      client.off('status', handleStatus);

      // Only disconnect if we actually connected
      // Check if client is in a connected or connecting state
      const currentStatus = client.getStatus?.() ?? 'disconnected';
      if (currentStatus !== 'disconnected') {
        client.disconnect();
      }
    };
  }, [client, autoConnect, token]);

  const value = useMemo(
    () => ({
      client,
      status,
      isConnected: status === 'connected',
    }),
    [client, status]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context.client) {
    throw new Error(
      'useWebSocketContext must be used within WebSocketProvider'
    );
  }

  return context;
}
