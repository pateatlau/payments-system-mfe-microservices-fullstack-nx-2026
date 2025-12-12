/**
 * WebSocket Types and Interfaces
 *
 * Defines types for WebSocket server implementation including:
 * - Authenticated WebSocket connections
 * - WebSocket messages
 * - Room/channel types
 * - Event types
 */

import type { WebSocket } from 'ws';

/**
 * User role types
 */
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';

/**
 * Authenticated WebSocket connection
 * Extends base WebSocket with authentication metadata
 */
export interface AuthenticatedWebSocket extends WebSocket {
  /**
   * Unique user ID from JWT
   */
  userId: string;

  /**
   * User role from JWT
   */
  userRole: UserRole;

  /**
   * Heartbeat status (for ping/pong)
   */
  isAlive: boolean;

  /**
   * Connection timestamp
   */
  connectedAt: Date;

  /**
   * Last activity timestamp
   */
  lastActivityAt: Date;

  /**
   * Rooms this connection is subscribed to
   */
  rooms: Set<string>;
}

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  // Client → Server
  | 'ping'
  | 'subscribe'
  | 'unsubscribe'
  | 'message'
  // Server → Client
  | 'pong'
  | 'subscribed'
  | 'unsubscribed'
  | 'event'
  | 'error'
  | 'connected';

/**
 * WebSocket message payload
 */
export interface WebSocketMessage<T = unknown> {
  /**
   * Message type
   */
  type: WebSocketMessageType;

  /**
   * Message payload
   */
  payload?: T;

  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Optional message ID for tracking
   */
  id?: string;
}

/**
 * Room types for message routing
 */
export enum RoomType {
  /**
   * User-specific room: user:{userId}
   */
  USER = 'user',

  /**
   * Role-based room: role:{role}
   */
  ROLE = 'role',

  /**
   * Broadcast to all: broadcast
   */
  BROADCAST = 'broadcast',

  /**
   * Payment-specific room: payment:{paymentId}
   */
  PAYMENT = 'payment',
}

/**
 * Event payload types
 */
export interface PaymentEventPayload {
  paymentId: string;
  userId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface UserEventPayload {
  userId: string;
  action: string;
  timestamp: string;
}

export interface AdminEventPayload {
  adminId: string;
  action: string;
  targetId?: string;
  timestamp: string;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  /**
   * Total active connections
   */
  totalConnections: number;

  /**
   * Connections by user ID
   */
  connectionsByUser: Map<string, number>;

  /**
   * Connections by role
   */
  connectionsByRole: Map<UserRole, number>;

  /**
   * Total rooms
   */
  totalRooms: number;

  /**
   * Messages sent (since server start)
   */
  messagesSent: number;

  /**
   * Messages received (since server start)
   */
  messagesReceived: number;
}

/**
 * JWT payload for WebSocket authentication
 */
export interface WebSocketJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Room info
 */
export interface RoomInfo {
  /**
   * Room name
   */
  name: string;

  /**
   * Number of connections in room
   */
  connectionCount: number;

  /**
   * Room type
   */
  type: RoomType;
}
