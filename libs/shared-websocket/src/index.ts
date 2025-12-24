/**
 * Shared WebSocket Library
 *
 * Production-ready WebSocket client for React applications with:
 * - Automatic reconnection with exponential backoff
 * - Message queuing for offline messages
 * - React hooks for easy integration
 * - TanStack Query integration for real-time updates
 * - JWT authentication support
 */

// Core client
export { WebSocketClient } from './lib/client';
export { ReconnectionManager } from './lib/reconnection';

// Types
export type {
  WebSocketClientConfig,
  WebSocketMessage,
  WebSocketMessageType,
  ConnectionStatus,
  EventListener,
  IWebSocketClient,
  WebSocketEventPayload,
} from './lib/types';

// Context
export {
  WebSocketProvider,
  useWebSocketContext,
} from './context/WebSocketProvider';
export type { WebSocketProviderProps } from './context/WebSocketProvider';

// Hooks
export { useWebSocket } from './hooks/useWebSocket';
export type { UseWebSocketReturn } from './hooks/useWebSocket';
export { useWebSocketSubscription } from './hooks/useWebSocketSubscription';
export {
  useRealTimeUpdates,
  useRealTimeQueryUpdate,
} from './hooks/useRealTimeUpdates';
export type { RealTimeUpdateConfig } from './hooks/useRealTimeUpdates';
