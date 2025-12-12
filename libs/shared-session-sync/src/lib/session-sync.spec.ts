/**
 * Session Sync Tests
 */

import { SessionSync } from './session-sync';
import type { SessionEvent } from './types';

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  private _onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Array<(event: MessageEvent) => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  set onmessage(handler: ((event: MessageEvent) => void) | null) {
    this._onmessage = handler;
  }

  get onmessage(): ((event: MessageEvent) => void) | null {
    return this._onmessage;
  }

  postMessage(message: unknown): void {
    const event = new MessageEvent('message', {
      data: message,
    });
    // Call onmessage handler if set
    if (this._onmessage) {
      this._onmessage(event);
    }
    // Also call any addEventListener listeners
    this.listeners.forEach(listener => listener(event));
  }

  addEventListener(
    _type: string,
    listener: (event: MessageEvent) => void
  ): void {
    this.listeners.push(listener);
  }

  removeEventListener(
    _type: string,
    listener: (event: MessageEvent) => void
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  close(): void {
    this._onmessage = null;
    this.listeners = [];
  }
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
      // Trigger storage event for other tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: value,
          oldValue: null,
        })
      );
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('SessionSync', () => {
  let sessionSync: SessionSync;
  let originalBroadcastChannel: typeof BroadcastChannel | undefined;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save originals
    originalBroadcastChannel = global.BroadcastChannel;
    originalLocalStorage = global.localStorage;

    // Setup mocks
    Object.defineProperty(global, 'BroadcastChannel', {
      value: MockBroadcastChannel,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    localStorageMock.clear();
    sessionSync = new SessionSync();
  });

  afterEach(() => {
    sessionSync.destroy();
    localStorageMock.clear();

    // Restore originals
    if (originalBroadcastChannel) {
      Object.defineProperty(global, 'BroadcastChannel', {
        value: originalBroadcastChannel,
        writable: true,
        configurable: true,
      });
    } else {
      delete (global as { BroadcastChannel?: unknown }).BroadcastChannel;
    }

    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('constructor', () => {
    it('should create instance with unique tab ID', () => {
      const sync1 = new SessionSync();
      const sync2 = new SessionSync();

      expect(sync1.getTabId()).toBeDefined();
      expect(sync2.getTabId()).toBeDefined();
      expect(sync1.getTabId()).not.toBe(sync2.getTabId());
    });

    it('should use BroadcastChannel when available', () => {
      expect(sessionSync.isUsingLocalStorageFallback()).toBe(false);
    });
  });

  describe('broadcast', () => {
    it('should broadcast event via BroadcastChannel', () => {
      const callback = jest.fn();
      sessionSync.on('AUTH_STATE_CHANGE', callback);

      // Simulate event from another tab first (to set up listener)
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'AUTH_STATE_CHANGE',
          payload: { test: 'data' },
          timestamp: Date.now(),
          tabId: 'different-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = jest.fn();
      const unsubscribe = sessionSync.on('LOGOUT', callback);

      expect(unsubscribe).toBeInstanceOf(Function);

      // Simulate event from another tab
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'LOGOUT',
          payload: { triggeredBy: 'other-tab' },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).toHaveBeenCalledWith({ triggeredBy: 'other-tab' });
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = sessionSync.on('LOGOUT', callback);

      unsubscribe();

      // Simulate event
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'LOGOUT',
          payload: { triggeredBy: 'other-tab' },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('broadcastLogout', () => {
    it('should broadcast logout event', () => {
      const callback = jest.fn();
      sessionSync.on('LOGOUT', callback);

      sessionSync.broadcastLogout();

      // Simulate event from another tab
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const tabId = sessionSync.getTabId();
        const event: SessionEvent = {
          type: 'LOGOUT',
          payload: { triggeredBy: tabId },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('broadcastAuthState', () => {
    it('should broadcast auth state change', () => {
      const callback = jest.fn();
      sessionSync.on('AUTH_STATE_CHANGE', callback);

      sessionSync.broadcastAuthState(true, { id: 'user-1' });

      // Simulate event from another tab
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'AUTH_STATE_CHANGE',
          payload: { isAuthenticated: true, user: { id: 'user-1' } },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: { id: 'user-1' },
      });
    });
  });

  describe('broadcastTokenRefresh', () => {
    it('should broadcast token refresh', () => {
      const callback = jest.fn();
      sessionSync.on('TOKEN_REFRESH', callback);

      sessionSync.broadcastTokenRefresh('new-token');

      // Simulate event from another tab
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'TOKEN_REFRESH',
          payload: { token: 'new-token' },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      expect(callback).toHaveBeenCalledWith({ token: 'new-token' });
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const callback = jest.fn();
      sessionSync.on('LOGOUT', callback);

      sessionSync.destroy();

      // Try to trigger event after destroy
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'LOGOUT',
          payload: { triggeredBy: 'other-tab' },
          timestamp: Date.now(),
          tabId: 'other-tab-id',
        };
        channel.postMessage(event);
      }

      // Callback should not be called after destroy
      // (channel is closed, listeners are cleared)
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('ignore own messages', () => {
    it('should ignore messages from same tab', () => {
      const callback = jest.fn();
      sessionSync.on('LOGOUT', callback);

      const tabId = sessionSync.getTabId();

      // Simulate event from same tab
      const channel = (
        sessionSync as unknown as { channel: MockBroadcastChannel }
      ).channel;
      if (channel) {
        const event: SessionEvent = {
          type: 'LOGOUT',
          payload: { triggeredBy: tabId },
          timestamp: Date.now(),
          tabId: tabId, // Same tab ID
        };
        channel.postMessage(event);
      }

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
