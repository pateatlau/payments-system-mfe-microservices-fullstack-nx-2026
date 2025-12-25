/**
 * Connection Manager
 *
 * Manages WebSocket connections by user ID and provides:
 * - Connection tracking
 * - Connection retrieval
 * - Connection statistics
 * - Connection cleanup
 */

import type {
  AuthenticatedWebSocket,
  ConnectionStats,
  UserRole,
} from './types';
import { logger } from '../utils/logger';

export class ConnectionManager {
  /**
   * Map of userId → Set of WebSocket connections
   * A user can have multiple connections (multiple tabs/devices)
   */
  private connections: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  /**
   * Map of WebSocket → userId for reverse lookup
   */
  private connectionToUser: WeakMap<AuthenticatedWebSocket, string> =
    new WeakMap();

  /**
   * Add a connection
   */
  addConnection(ws: AuthenticatedWebSocket): void {
    const { userId } = ws;

    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId)!.add(ws);
    this.connectionToUser.set(ws, userId);

    logger.info(`WebSocket connection added for user ${userId}`, {
      userId,
      totalUserConnections: this.connections.get(userId)!.size,
      totalConnections: this.getTotalConnections(),
    });
  }

  /**
   * Remove a connection
   */
  removeConnection(ws: AuthenticatedWebSocket): void {
    const userId = this.connectionToUser.get(ws);

    if (!userId) {
      logger.warn('Attempted to remove unknown WebSocket connection');
      return;
    }

    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);

      if (userConnections.size === 0) {
        this.connections.delete(userId);
        logger.info(`All connections removed for user ${userId}`);
      } else {
        logger.info(`WebSocket connection removed for user ${userId}`, {
          userId,
          remainingConnections: userConnections.size,
        });
      }
    }
  }

  /**
   * Get all connections for a user
   */
  getConnectionsByUserId(userId: string): Set<AuthenticatedWebSocket> {
    return this.connections.get(userId) || new Set();
  }

  /**
   * Get all connections for a role
   */
  getConnectionsByRole(role: UserRole): Set<AuthenticatedWebSocket> {
    const connections = new Set<AuthenticatedWebSocket>();

    for (const userConnections of this.connections.values()) {
      for (const ws of userConnections) {
        if (ws.userRole === role) {
          connections.add(ws);
        }
      }
    }

    return connections;
  }

  /**
   * Get all connections
   */
  getAllConnections(): Set<AuthenticatedWebSocket> {
    const allConnections = new Set<AuthenticatedWebSocket>();

    for (const userConnections of this.connections.values()) {
      for (const ws of userConnections) {
        allConnections.add(ws);
      }
    }

    return allConnections;
  }

  /**
   * Check if user has any active connections
   */
  hasConnections(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return !!userConnections && userConnections.size > 0;
  }

  /**
   * Get total number of connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const userConnections of this.connections.values()) {
      total += userConnections.size;
    }
    return total;
  }

  /**
   * Get total number of unique users
   */
  getTotalUsers(): number {
    return this.connections.size;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    const connectionsByUser = new Map<string, number>();
    const connectionsByRole = new Map<UserRole, number>();

    for (const [userId, userConnections] of this.connections.entries()) {
      connectionsByUser.set(userId, userConnections.size);

      for (const ws of userConnections) {
        const count = connectionsByRole.get(ws.userRole) || 0;
        connectionsByRole.set(ws.userRole, count + 1);
      }
    }

    return {
      totalConnections: this.getTotalConnections(),
      connectionsByUser,
      connectionsByRole,
      totalRooms: 0, // Will be set by RoomManager
      messagesSent: 0, // Will be tracked by server
      messagesReceived: 0, // Will be tracked by server
    };
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  closeAll(): void {
    logger.info('Closing all WebSocket connections', {
      totalConnections: this.getTotalConnections(),
    });

    for (const userConnections of this.connections.values()) {
      for (const ws of userConnections) {
        try {
          ws.close(1001, 'Server shutting down');
        } catch (error) {
          logger.error('Error closing WebSocket connection', { error });
        }
      }
    }

    this.connections.clear();
  }
}
