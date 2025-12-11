/**
 * Connection Manager Tests
 */

import { ConnectionManager } from './connection-manager';
import type { AuthenticatedWebSocket } from './types';
import { WebSocket } from 'ws';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;
  let mockWs1: AuthenticatedWebSocket;
  let mockWs2: AuthenticatedWebSocket;

  beforeEach(() => {
    manager = new ConnectionManager();

    // Create mock WebSocket connections
    mockWs1 = {
      userId: 'user1',
      userRole: 'CUSTOMER',
      isAlive: true,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      rooms: new Set(),
      readyState: WebSocket.OPEN,
    } as unknown as AuthenticatedWebSocket;

    mockWs2 = {
      userId: 'user2',
      userRole: 'ADMIN',
      isAlive: true,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      rooms: new Set(),
      readyState: WebSocket.OPEN,
    } as unknown as AuthenticatedWebSocket;
  });

  describe('addConnection', () => {
    it('should add a connection', () => {
      manager.addConnection(mockWs1);

      expect(manager.hasConnections('user1')).toBe(true);
      expect(manager.getTotalConnections()).toBe(1);
    });

    it('should add multiple connections for same user', () => {
      const mockWs1b = { ...mockWs1 } as AuthenticatedWebSocket;

      manager.addConnection(mockWs1);
      manager.addConnection(mockWs1b);

      const connections = manager.getConnectionsByUserId('user1');
      expect(connections.size).toBe(2);
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      manager.addConnection(mockWs1);
      manager.removeConnection(mockWs1);

      expect(manager.hasConnections('user1')).toBe(false);
      expect(manager.getTotalConnections()).toBe(0);
    });

    it('should handle removing non-existent connection', () => {
      expect(() => manager.removeConnection(mockWs1)).not.toThrow();
    });
  });

  describe('getConnectionsByUserId', () => {
    it('should return user connections', () => {
      manager.addConnection(mockWs1);

      const connections = manager.getConnectionsByUserId('user1');
      expect(connections.size).toBe(1);
      expect(connections.has(mockWs1)).toBe(true);
    });

    it('should return empty set for non-existent user', () => {
      const connections = manager.getConnectionsByUserId('nonexistent');
      expect(connections.size).toBe(0);
    });
  });

  describe('getConnectionsByRole', () => {
    it('should return connections for role', () => {
      manager.addConnection(mockWs1);
      manager.addConnection(mockWs2);

      const customerConnections = manager.getConnectionsByRole('CUSTOMER');
      expect(customerConnections.size).toBe(1);
      expect(customerConnections.has(mockWs1)).toBe(true);

      const adminConnections = manager.getConnectionsByRole('ADMIN');
      expect(adminConnections.size).toBe(1);
      expect(adminConnections.has(mockWs2)).toBe(true);
    });
  });

  describe('getAllConnections', () => {
    it('should return all connections', () => {
      manager.addConnection(mockWs1);
      manager.addConnection(mockWs2);

      const allConnections = manager.getAllConnections();
      expect(allConnections.size).toBe(2);
      expect(allConnections.has(mockWs1)).toBe(true);
      expect(allConnections.has(mockWs2)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return connection statistics', () => {
      manager.addConnection(mockWs1);
      manager.addConnection(mockWs2);

      const stats = manager.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.connectionsByUser.get('user1')).toBe(1);
      expect(stats.connectionsByUser.get('user2')).toBe(1);
      expect(stats.connectionsByRole.get('CUSTOMER')).toBe(1);
      expect(stats.connectionsByRole.get('ADMIN')).toBe(1);
    });
  });

  describe('closeAll', () => {
    it('should close all connections', () => {
      const closeSpy1 = jest.fn();
      const closeSpy2 = jest.fn();
      mockWs1.close = closeSpy1;
      mockWs2.close = closeSpy2;

      manager.addConnection(mockWs1);
      manager.addConnection(mockWs2);

      manager.closeAll();

      expect(closeSpy1).toHaveBeenCalledWith(1001, 'Server shutting down');
      expect(closeSpy2).toHaveBeenCalledWith(1001, 'Server shutting down');
      expect(manager.getTotalConnections()).toBe(0);
    });
  });
});
