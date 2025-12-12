/**
 * Room Manager
 *
 * Manages WebSocket rooms/channels for targeted message delivery:
 * - user:{userId} - Messages for specific user
 * - role:{role} - Messages for specific role (admin, customer, vendor)
 * - broadcast - Messages for all connected clients
 * - payment:{paymentId} - Messages for specific payment
 *
 * Features:
 * - Subscribe/unsubscribe from rooms
 * - Broadcast messages to rooms
 * - Room statistics
 */

import type { AuthenticatedWebSocket, RoomInfo, RoomType } from './types';
import { logger } from '../utils/logger';

export class RoomManager {
  /**
   * Map of roomName → Set of WebSocket connections
   */
  private rooms: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  /**
   * Map of WebSocket → Set of room names (for cleanup)
   */
  private connectionRooms: WeakMap<AuthenticatedWebSocket, Set<string>> =
    new WeakMap();

  /**
   * Join a room
   */
  join(ws: AuthenticatedWebSocket, roomName: string): void {
    // Add to room
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(ws);

    // Track connection's rooms
    let wsRooms = this.connectionRooms.get(ws);
    if (!wsRooms) {
      wsRooms = new Set();
      this.connectionRooms.set(ws, wsRooms);
    }
    wsRooms.add(roomName);

    // Add to ws.rooms for visibility
    ws.rooms.add(roomName);

    logger.debug(`WebSocket joined room ${roomName}`, {
      userId: ws.userId,
      roomName,
      roomSize: this.rooms.get(roomName)!.size,
    });
  }

  /**
   * Leave a room
   */
  leave(ws: AuthenticatedWebSocket, roomName: string): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(ws);

      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomName);
        logger.debug(`Room ${roomName} removed (empty)`);
      }
    }

    // Remove from connection's rooms
    const wsRooms = this.connectionRooms.get(ws);
    if (wsRooms) {
      wsRooms.delete(roomName);
    }

    // Remove from ws.rooms
    ws.rooms.delete(roomName);

    logger.debug(`WebSocket left room ${roomName}`, {
      userId: ws.userId,
      roomName,
    });
  }

  /**
   * Remove connection from all rooms (called on disconnect)
   */
  leaveAll(ws: AuthenticatedWebSocket): void {
    const wsRooms = this.connectionRooms.get(ws);

    if (wsRooms) {
      for (const roomName of wsRooms) {
        const room = this.rooms.get(roomName);
        if (room) {
          room.delete(ws);

          if (room.size === 0) {
            this.rooms.delete(roomName);
          }
        }
      }
    }

    // Clear ws.rooms
    ws.rooms.clear();

    logger.debug(`WebSocket left all rooms`, {
      userId: ws.userId,
    });
  }

  /**
   * Broadcast message to a room
   */
  broadcast(roomName: string, message: string | Buffer): void {
    const room = this.rooms.get(roomName);

    if (!room) {
      logger.debug(`Broadcast to non-existent room ${roomName} skipped`);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const ws of room) {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
          successCount++;
        }
      } catch (error) {
        failureCount++;
        logger.error(`Failed to send message to client in room ${roomName}`, {
          error,
          userId: ws.userId,
        });
      }
    }

    logger.debug(`Broadcast to room ${roomName}`, {
      roomName,
      roomSize: room.size,
      successCount,
      failureCount,
    });
  }

  /**
   * Broadcast to all connections (convenience method)
   */
  broadcastAll(message: string | Buffer): void {
    this.broadcast('broadcast', message);
  }

  /**
   * Get all connections in a room
   */
  getRoom(roomName: string): Set<AuthenticatedWebSocket> {
    return this.rooms.get(roomName) || new Set();
  }

  /**
   * Get all room names a connection is subscribed to
   */
  getRoomsForConnection(ws: AuthenticatedWebSocket): Set<string> {
    return this.connectionRooms.get(ws) || new Set();
  }

  /**
   * Check if a room exists
   */
  hasRoom(roomName: string): boolean {
    return this.rooms.has(roomName);
  }

  /**
   * Get room size
   */
  getRoomSize(roomName: string): number {
    return this.rooms.get(roomName)?.size || 0;
  }

  /**
   * Get all room names
   */
  getAllRoomNames(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Get total number of rooms
   */
  getTotalRooms(): number {
    return this.rooms.size;
  }

  /**
   * Get room information
   */
  getRoomInfo(roomName: string): RoomInfo | null {
    const room = this.rooms.get(roomName);

    if (!room) {
      return null;
    }

    // Determine room type from name
    let type: RoomType;
    if (roomName === 'broadcast') {
      type = 'broadcast' as RoomType;
    } else if (roomName.startsWith('user:')) {
      type = 'user' as RoomType;
    } else if (roomName.startsWith('role:')) {
      type = 'role' as RoomType;
    } else if (roomName.startsWith('payment:')) {
      type = 'payment' as RoomType;
    } else {
      type = 'broadcast' as RoomType; // Default
    }

    return {
      name: roomName,
      connectionCount: room.size,
      type,
    };
  }

  /**
   * Get all room information
   */
  getAllRoomInfo(): RoomInfo[] {
    return this.getAllRoomNames()
      .map((name) => this.getRoomInfo(name))
      .filter((info): info is RoomInfo => info !== null);
  }

  /**
   * Clear all rooms (for shutdown)
   */
  clearAll(): void {
    logger.info('Clearing all WebSocket rooms', {
      totalRooms: this.rooms.size,
    });

    this.rooms.clear();
  }
}
