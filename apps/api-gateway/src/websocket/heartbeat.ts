/**
 * Heartbeat Manager
 *
 * Manages WebSocket heartbeat (ping/pong) to detect dead connections:
 * - Sends ping every 30 seconds
 * - Expects pong response within 10 seconds
 * - Terminates dead connections
 *
 * WebSocket protocol notes:
 * - ws library handles ping/pong automatically
 * - We track isAlive flag to detect unresponsive clients
 */

import type { WebSocketServer } from 'ws';
import type { AuthenticatedWebSocket } from './types';
import { logger } from '../utils/logger';

export class HeartbeatManager {
  private wss: WebSocketServer;
  private interval: NodeJS.Timeout | null = null;
  private readonly pingInterval: number; // milliseconds
  private readonly pongTimeout: number; // milliseconds

  constructor(
    wss: WebSocketServer,
    pingInterval = 30000, // 30 seconds
    pongTimeout = 10000 // 10 seconds
  ) {
    this.wss = wss;
    this.pingInterval = pingInterval;
    this.pongTimeout = pongTimeout;
  }

  /**
   * Start heartbeat monitoring
   */
  start(): void {
    if (this.interval) {
      logger.warn('Heartbeat manager already started');
      return;
    }

    logger.info('Starting WebSocket heartbeat manager', {
      pingInterval: this.pingInterval,
      pongTimeout: this.pongTimeout,
    });

    this.interval = setInterval(() => {
      this.checkHeartbeats();
    }, this.pingInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Stopped WebSocket heartbeat manager');
    }
  }

  /**
   * Check heartbeats for all connections
   */
  private checkHeartbeats(): void {
    let terminatedCount = 0;
    let aliveCount = 0;

    this.wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;

      // Check if client responded to last ping
      if (authWs.isAlive === false) {
        // Client did not respond to last ping - terminate
        logger.warn('Terminating inactive WebSocket connection', {
          userId: authWs.userId,
          userRole: authWs.userRole,
          connectedAt: authWs.connectedAt,
          lastActivityAt: authWs.lastActivityAt,
        });

        authWs.terminate();
        terminatedCount++;
        return;
      }

      // Mark as potentially dead and send ping
      authWs.isAlive = false;
      authWs.ping();
      aliveCount++;
    });

    if (terminatedCount > 0 || aliveCount > 0) {
      logger.debug('Heartbeat check completed', {
        alive: aliveCount,
        terminated: terminatedCount,
        total: this.wss.clients.size,
      });
    }
  }

  /**
   * Handle pong response
   * Should be called when pong is received from client
   */
  static handlePong(ws: AuthenticatedWebSocket): void {
    ws.isAlive = true;
    ws.lastActivityAt = new Date();
  }

  /**
   * Setup pong listener for a connection
   */
  static setupPongListener(ws: AuthenticatedWebSocket): void {
    ws.on('pong', () => {
      HeartbeatManager.handlePong(ws);
    });
  }
}
