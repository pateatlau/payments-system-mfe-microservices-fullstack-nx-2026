/**
 * WebSocket Server
 *
 * Main WebSocket server implementation for API Gateway:
 * - Handles WebSocket upgrade requests
 * - Authenticates connections via JWT
 * - Manages connections and rooms
 * - Implements heartbeat monitoring
 * - Provides message broadcasting capabilities
 *
 * Architecture:
 * - HTTP server handles upgrade requests
 * - JWT authentication on connection
 * - Auto-subscribe to user, role, and broadcast rooms
 * - Heartbeat ping/pong every 30s
 * - Connection cleanup on disconnect
 */

import type { Server as HTTPServer, IncomingMessage } from 'http';
import type { Socket } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  AuthenticatedWebSocket,
  WebSocketMessage,
  WebSocketMessageType,
  ConnectionStats,
  RoomInfo,
} from './types';
import { authenticateWebSocket } from './auth';
import { ConnectionManager } from './connection-manager';
import { RoomManager } from './room-manager';
import { HeartbeatManager } from './heartbeat';
import { WebSocketEventBridge } from './event-bridge';
import { logger } from '../utils/logger';

export interface WebSocketServerInstance {
  wss: WebSocketServer;
  connectionManager: ConnectionManager;
  roomManager: RoomManager;
  heartbeatManager: HeartbeatManager;
  eventBridge: WebSocketEventBridge;
  broadcast: (roomName: string, message: WebSocketMessage) => void;
  broadcastAll: (message: WebSocketMessage) => void;
  getStats: () => ConnectionStats;
  getAllRoomInfo: () => RoomInfo[];
  close: () => Promise<void>;
}

/**
 * Create WebSocket message
 */
export function createWebSocketMessage<T = unknown>(
  type: WebSocketMessageType,
  payload?: T,
  id?: string
): WebSocketMessage<T> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id,
  };
}

/**
 * Send WebSocket message to client
 */
export function sendMessage(
  ws: AuthenticatedWebSocket,
  message: WebSocketMessage
): void {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch (error) {
    logger.error('Failed to send WebSocket message', {
      error,
      userId: ws.userId,
      messageType: message.type,
    });
  }
}

/**
 * Create and configure WebSocket server
 */
export function createWebSocketServer(
  httpServer: HTTPServer
): WebSocketServerInstance {
  // Create WebSocket server (noServer mode - manual upgrade handling)
  const wss = new WebSocketServer({ noServer: true });

  // Create managers
  const connectionManager = new ConnectionManager();
  const roomManager = new RoomManager();
  const heartbeatManager = new HeartbeatManager(wss, 30000, 10000);
  const eventBridge = new WebSocketEventBridge(roomManager);

  // Statistics
  let messagesSent = 0;
  let messagesReceived = 0;

  /**
   * Handle WebSocket upgrade requests
   */
  httpServer.on(
    'upgrade',
    async (request: IncomingMessage, socket: Socket, head: Buffer) => {
      try {
        // Check if this is a WebSocket upgrade request
        if (!request.url?.startsWith('/ws')) {
          socket.destroy();
          return;
        }

        // Authenticate connection
        const payload = await authenticateWebSocket(request.url);

        // Handle upgrade
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          const authWs = ws as AuthenticatedWebSocket;

          // Set authentication metadata
          authWs.userId = payload.userId;
          authWs.userRole = payload.role;
          authWs.isAlive = true;
          authWs.connectedAt = new Date();
          authWs.lastActivityAt = new Date();
          authWs.rooms = new Set();

          // Emit connection event
          wss.emit('connection', authWs, request);
        });
      } catch (error) {
        logger.warn('WebSocket authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: request.url,
        });

        // Send 401 Unauthorized
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    }
  );

  /**
   * Handle new WebSocket connections
   */
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const authWs = ws as AuthenticatedWebSocket;

    logger.info('WebSocket connection established', {
      userId: authWs.userId,
      userRole: authWs.userRole,
      remoteAddress: request.socket.remoteAddress,
    });

    // Add to connection manager
    connectionManager.addConnection(authWs);

    // Auto-subscribe to rooms
    roomManager.join(authWs, `user:${authWs.userId}`);
    roomManager.join(authWs, `role:${authWs.userRole.toLowerCase()}`);
    roomManager.join(authWs, 'broadcast');

    // Setup heartbeat listener
    HeartbeatManager.setupPongListener(authWs);

    // Send connected message
    sendMessage(
      authWs,
      createWebSocketMessage('connected', {
        userId: authWs.userId,
        rooms: Array.from(authWs.rooms),
      })
    );

    /**
     * Handle incoming messages
     */
    authWs.on('message', (data: Buffer) => {
      messagesReceived++;

      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        logger.debug('WebSocket message received', {
          userId: authWs.userId,
          messageType: message.type,
        });

        // Handle ping
        if (message.type === 'ping') {
          sendMessage(authWs, createWebSocketMessage('pong'));
          return;
        }

        // Handle subscribe
        if (message.type === 'subscribe' && message.payload) {
          const roomName = (message.payload as { room: string }).room;
          roomManager.join(authWs, roomName);
          sendMessage(
            authWs,
            createWebSocketMessage('subscribed', { room: roomName })
          );
          return;
        }

        // Handle unsubscribe
        if (message.type === 'unsubscribe' && message.payload) {
          const roomName = (message.payload as { room: string }).room;
          roomManager.leave(authWs, roomName);
          sendMessage(
            authWs,
            createWebSocketMessage('unsubscribed', { room: roomName })
          );
          return;
        }

        // Other messages - log for now
        logger.debug('Unhandled WebSocket message type', {
          userId: authWs.userId,
          messageType: message.type,
        });
      } catch (error) {
        logger.error('Failed to parse WebSocket message', {
          error,
          userId: authWs.userId,
        });

        sendMessage(
          authWs,
          createWebSocketMessage('error', {
            message: 'Invalid message format',
          })
        );
      }
    });

    /**
     * Handle connection close
     */
    authWs.on('close', (code: number, reason: Buffer) => {
      logger.info('WebSocket connection closed', {
        userId: authWs.userId,
        code,
        reason: reason.toString(),
      });

      // Remove from all rooms
      roomManager.leaveAll(authWs);

      // Remove from connection manager
      connectionManager.removeConnection(authWs);
    });

    /**
     * Handle errors
     */
    authWs.on('error', (error: Error) => {
      logger.error('WebSocket error', {
        error,
        userId: authWs.userId,
      });
    });
  });

  /**
   * Start heartbeat manager
   */
  heartbeatManager.start();

  /**
   * Start event bridge (connect to RabbitMQ)
   */
  eventBridge.start().catch((error: Error) => {
    logger.error('Failed to start WebSocket Event Bridge', { error });
    // Don't fail the entire WebSocket server if event bridge fails
    // Events just won't be forwarded until it's fixed
  });

  /**
   * Broadcast message to room
   */
  function broadcast(roomName: string, message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    roomManager.broadcast(roomName, messageStr);
    messagesSent += roomManager.getRoomSize(roomName);
  }

  /**
   * Broadcast message to all connections
   */
  function broadcastAll(message: WebSocketMessage): void {
    broadcast('broadcast', message);
  }

  /**
   * Get connection statistics
   */
  function getStats(): ConnectionStats {
    const stats = connectionManager.getStats();
    stats.totalRooms = roomManager.getTotalRooms();
    stats.messagesSent = messagesSent;
    stats.messagesReceived = messagesReceived;
    return stats;
  }

  /**
   * Get all room information
   */
  function getAllRoomInfo(): RoomInfo[] {
    return roomManager.getAllRoomInfo();
  }

  /**
   * Close WebSocket server
   */
  async function close(): Promise<void> {
    logger.info('Closing WebSocket server');

    // Stop event bridge
    await eventBridge.stop();

    // Stop heartbeat
    heartbeatManager.stop();

    // Close all connections
    connectionManager.closeAll();

    // Clear all rooms
    roomManager.clearAll();

    // Close WebSocket server
    return new Promise((resolve, reject) => {
      wss.close((error) => {
        if (error) {
          logger.error('Error closing WebSocket server', { error });
          reject(error);
        } else {
          logger.info('WebSocket server closed');
          resolve();
        }
      });
    });
  }

  logger.info('WebSocket server created', {
    heartbeatInterval: 30000,
    pongTimeout: 10000,
    eventBridge: true,
  });

  return {
    wss,
    connectionManager,
    roomManager,
    heartbeatManager,
    eventBridge,
    broadcast,
    broadcastAll,
    getStats,
    getAllRoomInfo,
    close,
  };
}
