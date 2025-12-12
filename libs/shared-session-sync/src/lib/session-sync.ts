/**
 * Session Sync Library
 *
 * Provides cross-tab session synchronization using BroadcastChannel API
 * with localStorage fallback for older browsers.
 *
 * Features:
 * - Sync authentication state across tabs
 * - Propagate logout to all tabs
 * - Sync token refresh across tabs
 * - Automatic fallback to localStorage for older browsers
 */

import type {
  SessionEvent,
  SessionEventType,
  AuthStateChangePayload,
  TokenRefreshPayload,
  LogoutPayload,
} from './types';

/**
 * SessionSync class for cross-tab communication
 */
export class SessionSync {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Map<SessionEventType, Set<(data: unknown) => void>> =
    new Map();
  private useLocalStorage = false;
  private storageEventHandler: ((event: StorageEvent) => void) | null = null;

  constructor(channelName = 'mfe-session-sync') {
    this.tabId = this.generateTabId();
    this.initChannel(channelName);
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize communication channel
   */
  private initChannel(channelName: string): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = this.handleMessage.bind(this);
      } catch (error) {
        console.warn(
          '[SessionSync] BroadcastChannel failed, using localStorage fallback',
          error
        );
        this.useLocalStorage = true;
        this.initLocalStorageFallback();
      }
    } else {
      // Fallback to localStorage for older browsers
      this.useLocalStorage = true;
      this.initLocalStorageFallback();
    }
  }

  /**
   * Initialize localStorage fallback
   */
  private initLocalStorageFallback(): void {
    if (typeof window === 'undefined') return;

    this.storageEventHandler = this.handleStorageEvent.bind(this);
    window.addEventListener('storage', this.storageEventHandler);
  }

  /**
   * Broadcast a session event to all tabs
   */
  broadcast(type: SessionEventType, payload: unknown): void {
    const event: SessionEvent = {
      type,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    if (this.channel) {
      this.channel.postMessage(event);
    } else if (this.useLocalStorage && typeof window !== 'undefined') {
      // localStorage fallback: set and immediately remove to trigger storage event
      try {
        localStorage.setItem('session-sync-event', JSON.stringify(event));
        localStorage.removeItem('session-sync-event');
      } catch (error) {
        console.error(
          '[SessionSync] Failed to broadcast via localStorage',
          error
        );
      }
    }
  }

  /**
   * Subscribe to a session event type
   *
   * @param type - Event type to listen for
   * @param callback - Callback function to execute when event is received
   * @returns Unsubscribe function
   */
  on(type: SessionEventType, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Broadcast logout event to all tabs
   */
  broadcastLogout(): void {
    const payload: LogoutPayload = { triggeredBy: this.tabId };
    this.broadcast('LOGOUT', payload);
  }

  /**
   * Broadcast authentication state change to all tabs
   *
   * @param isAuthenticated - Whether user is authenticated
   * @param user - User object (optional)
   */
  broadcastAuthState(isAuthenticated: boolean, user?: unknown): void {
    const payload: AuthStateChangePayload = { isAuthenticated, user };
    this.broadcast('AUTH_STATE_CHANGE', payload);
  }

  /**
   * Broadcast token refresh to all tabs
   *
   * @param newToken - New access token
   */
  broadcastTokenRefresh(newToken: string): void {
    const payload: TokenRefreshPayload = { token: newToken };
    this.broadcast('TOKEN_REFRESH', payload);
  }

  /**
   * Handle BroadcastChannel message
   */
  private handleMessage(event: MessageEvent<SessionEvent>): void {
    if (event.data.tabId === this.tabId) {
      // Ignore own messages
      return;
    }
    this.notifyListeners(event.data);
  }

  /**
   * Handle localStorage storage event (fallback)
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === 'session-sync-event' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue) as SessionEvent;
        if (data.tabId === this.tabId) {
          // Ignore own messages
          return;
        }
        this.notifyListeners(data);
      } catch (error) {
        console.error('[SessionSync] Failed to parse storage event', error);
      }
    }
  }

  /**
   * Notify all listeners for an event type
   */
  private notifyListeners(event: SessionEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event.payload);
        } catch (error) {
          console.error(
            `[SessionSync] Error in listener for ${event.type}`,
            error
          );
        }
      });
    }
  }

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Check if using localStorage fallback
   */
  isUsingLocalStorageFallback(): boolean {
    return this.useLocalStorage;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.storageEventHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventHandler);
      this.storageEventHandler = null;
    }

    this.listeners.clear();
  }
}

/**
 * Singleton session sync instance
 */
export const sessionSync = new SessionSync();
