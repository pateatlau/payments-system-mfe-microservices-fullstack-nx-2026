/**
 * WebSocketClient Tests
 */

import { WebSocketClient } from './client';
import type { WebSocketClientConfig } from './types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send = jest.fn();
  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
    }
  });

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Replace global WebSocket
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWs: MockWebSocket;
  const config: WebSocketClientConfig = {
    url: 'ws://localhost:3000',
    token: 'test-token',
    autoReconnect: false, // Disable for tests
    debug: false,
  };

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    client = new WebSocketClient(config);
  });

  afterEach(() => {
    client.disconnect();
    jest.useRealTimers();
  });

  describe('connect', () => {
    it('should create WebSocket connection with token', () => {
      client.connect();

      // Access private ws property for testing
      mockWs = (client as never)['ws'] as MockWebSocket;

      expect(mockWs).toBeDefined();
      expect(mockWs.url).toContain('ws://localhost:3000');
      expect(mockWs.url).toContain('token=test-token');
    });

    it('should set status to connecting', () => {
      expect(client.getStatus()).toBe('disconnected');

      client.connect();

      expect(client.getStatus()).toBe('connecting');
    });

    it('should set status to connected on open', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;

      mockWs.simulateOpen();

      expect(client.getStatus()).toBe('connected');
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      client.disconnect();

      expect(mockWs.close).toHaveBeenCalledWith(1000, 'Client disconnect');
      expect(client.getStatus()).toBe('disconnected');
    });
  });

  describe('send', () => {
    it('should send message when connected', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      const message = {
        type: 'ping' as const,
        timestamp: new Date().toISOString(),
      };

      client.send(message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should queue message when disconnected', () => {
      const message = {
        type: 'ping' as const,
        timestamp: new Date().toISOString(),
      };

      client.send(message);

      // Message should be queued
      const queue = (client as never)['messageQueue'] as unknown[];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual(message);
    });

    it('should flush queue on connection', () => {
      const message1 = {
        type: 'ping' as const,
        timestamp: new Date().toISOString(),
      };
      const message2 = {
        type: 'subscribe' as const,
        payload: { eventType: 'test' },
        timestamp: new Date().toISOString(),
      };

      // Queue messages while disconnected
      client.send(message1);
      client.send(message2);

      // Connect
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      // Queue should be flushed
      expect(mockWs.send).toHaveBeenCalledTimes(2);
      expect((client as never)['messageQueue']).toHaveLength(0);
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should send subscribe message', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      client.subscribe('payment:created');

      expect(mockWs.send).toHaveBeenCalled();
      const call = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(call.type).toBe('subscribe');
      expect(call.payload.eventType).toBe('payment:created');
    });

    it('should send unsubscribe message', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      client.subscribe('payment:created');
      client.unsubscribe('payment:created');

      const calls = mockWs.send.mock.calls.map(call => JSON.parse(call[0]));
      expect(calls[1].type).toBe('unsubscribe');
      expect(calls[1].payload.eventType).toBe('payment:created');
    });

    it('should not subscribe twice to same event', () => {
      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      client.subscribe('payment:created');
      mockWs.send.mockClear();
      client.subscribe('payment:created');

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('should register and call event listeners', () => {
      const callback = jest.fn();

      client.on('test-event', callback);

      // Simulate internal emit
      (client as never)['emit']('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unregister event listeners', () => {
      const callback = jest.fn();

      client.on('test-event', callback);
      client.off('test-event', callback);

      (client as never)['emit']('test-event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle message events', () => {
      const callback = jest.fn();

      client.connect();
      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      client.on('payment:created', callback);

      const message = {
        type: 'event',
        payload: {
          eventType: 'payment:created',
          data: { id: '123' },
        },
        timestamp: new Date().toISOString(),
      };

      mockWs.simulateMessage(JSON.stringify(message));

      expect(callback).toHaveBeenCalledWith({ id: '123' });
    });
  });

  describe('status changes', () => {
    it('should emit status change events', () => {
      const statusCallback = jest.fn();

      client.on('status', statusCallback);
      client.connect();

      expect(statusCallback).toHaveBeenCalledWith({
        status: 'connecting',
        oldStatus: 'disconnected',
      });

      mockWs = (client as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      expect(statusCallback).toHaveBeenCalledWith({
        status: 'connected',
        oldStatus: 'connecting',
      });
    });
  });

  describe('ping/pong', () => {
    it('should send ping messages at interval', () => {
      const pingClient = new WebSocketClient({
        ...config,
        pingInterval: 1000,
      });

      pingClient.connect();
      mockWs = (pingClient as never)['ws'] as MockWebSocket;
      mockWs.simulateOpen();

      jest.advanceTimersByTime(1000);

      const calls = mockWs.send.mock.calls.map(call => JSON.parse(call[0]));
      const pings = calls.filter(call => call.type === 'ping');

      expect(pings.length).toBeGreaterThan(0);

      pingClient.disconnect();
    });
  });
});
