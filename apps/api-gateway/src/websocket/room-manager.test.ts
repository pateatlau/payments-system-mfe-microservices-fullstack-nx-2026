/**
 * Room Manager Tests
 */

import { RoomManager } from './room-manager';
import type { AuthenticatedWebSocket } from './types';
import { WebSocket } from 'ws';

describe('RoomManager', () => {
  let manager: RoomManager;
  let mockWs1: AuthenticatedWebSocket;
  let mockWs2: AuthenticatedWebSocket;

  beforeEach(() => {
    manager = new RoomManager();

    mockWs1 = {
      userId: 'user1',
      userRole: 'CUSTOMER',
      isAlive: true,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      rooms: new Set(),
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as unknown as AuthenticatedWebSocket;

    mockWs2 = {
      userId: 'user2',
      userRole: 'ADMIN',
      isAlive: true,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      rooms: new Set(),
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as unknown as AuthenticatedWebSocket;
  });

  describe('join', () => {
    it('should add connection to room', () => {
      manager.join(mockWs1, 'test-room');

      expect(manager.hasRoom('test-room')).toBe(true);
      expect(manager.getRoomSize('test-room')).toBe(1);
      expect(mockWs1.rooms.has('test-room')).toBe(true);
    });

    it('should add multiple connections to same room', () => {
      manager.join(mockWs1, 'test-room');
      manager.join(mockWs2, 'test-room');

      expect(manager.getRoomSize('test-room')).toBe(2);
    });
  });

  describe('leave', () => {
    it('should remove connection from room', () => {
      manager.join(mockWs1, 'test-room');
      manager.leave(mockWs1, 'test-room');

      expect(manager.hasRoom('test-room')).toBe(false);
      expect(mockWs1.rooms.has('test-room')).toBe(false);
    });

    it('should not remove room if other connections exist', () => {
      manager.join(mockWs1, 'test-room');
      manager.join(mockWs2, 'test-room');
      manager.leave(mockWs1, 'test-room');

      expect(manager.hasRoom('test-room')).toBe(true);
      expect(manager.getRoomSize('test-room')).toBe(1);
    });
  });

  describe('leaveAll', () => {
    it('should remove connection from all rooms', () => {
      manager.join(mockWs1, 'room1');
      manager.join(mockWs1, 'room2');
      manager.join(mockWs1, 'room3');

      manager.leaveAll(mockWs1);

      expect(mockWs1.rooms.size).toBe(0);
      expect(manager.hasRoom('room1')).toBe(false);
      expect(manager.hasRoom('room2')).toBe(false);
      expect(manager.hasRoom('room3')).toBe(false);
    });
  });

  describe('broadcast', () => {
    it('should send message to all connections in room', () => {
      manager.join(mockWs1, 'test-room');
      manager.join(mockWs2, 'test-room');

      manager.broadcast('test-room', 'test message');

      expect(mockWs1.send).toHaveBeenCalledWith('test message');
      expect(mockWs2.send).toHaveBeenCalledWith('test message');
    });

    it('should not fail for non-existent room', () => {
      expect(() => manager.broadcast('nonexistent', 'message')).not.toThrow();
    });

    it('should skip closed connections', () => {
      mockWs1.readyState = WebSocket.CLOSED;
      manager.join(mockWs1, 'test-room');

      manager.broadcast('test-room', 'test message');

      expect(mockWs1.send).not.toHaveBeenCalled();
    });
  });

  describe('getRoom', () => {
    it('should return room connections', () => {
      manager.join(mockWs1, 'test-room');

      const room = manager.getRoom('test-room');
      expect(room.size).toBe(1);
      expect(room.has(mockWs1)).toBe(true);
    });

    it('should return empty set for non-existent room', () => {
      const room = manager.getRoom('nonexistent');
      expect(room.size).toBe(0);
    });
  });

  describe('getRoomInfo', () => {
    it('should return room information', () => {
      manager.join(mockWs1, 'user:test123');
      manager.join(mockWs2, 'user:test123');

      const info = manager.getRoomInfo('user:test123');
      expect(info).not.toBeNull();
      expect(info?.name).toBe('user:test123');
      expect(info?.connectionCount).toBe(2);
      expect(info?.type).toBe('user');
    });

    it('should identify room types correctly', () => {
      manager.join(mockWs1, 'user:123');
      manager.join(mockWs1, 'role:admin');
      manager.join(mockWs1, 'payment:abc');
      manager.join(mockWs1, 'broadcast');

      expect(manager.getRoomInfo('user:123')?.type).toBe('user');
      expect(manager.getRoomInfo('role:admin')?.type).toBe('role');
      expect(manager.getRoomInfo('payment:abc')?.type).toBe('payment');
      expect(manager.getRoomInfo('broadcast')?.type).toBe('broadcast');
    });
  });

  describe('getAllRoomInfo', () => {
    it('should return all room information', () => {
      manager.join(mockWs1, 'room1');
      manager.join(mockWs2, 'room2');

      const allInfo = manager.getAllRoomInfo();
      expect(allInfo.length).toBe(2);
      expect(allInfo.some(info => info.name === 'room1')).toBe(true);
      expect(allInfo.some(info => info.name === 'room2')).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all rooms', () => {
      manager.join(mockWs1, 'room1');
      manager.join(mockWs2, 'room2');

      manager.clearAll();

      expect(manager.getTotalRooms()).toBe(0);
    });
  });
});
