/**
 * Event Bus Tests
 *
 * Tests for the EventBus class and event system
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventBus, createEventBus } from './event-bus';
import type { AuthLoginPayload } from './events/auth';
import type { PaymentCreatedPayload } from './events/payments';
import type { SystemErrorPayload } from './events/system';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = createEventBus();
  });

  describe('on and emit', () => {
    it('should subscribe and emit events', () => {
      const handler = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.on('auth:login', handler);
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        payload,
        expect.objectContaining({
          source: 'auth-mfe',
          version: 1,
          timestamp: expect.any(String),
        })
      );
    });

    it('should support multiple subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.on('auth:login', handler1);
      eventBus.on('auth:login', handler2);
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in handlers without affecting other handlers', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.on('auth:login', errorHandler);
      eventBus.on('auth:login', normalHandler);
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('off', () => {
    it('should unsubscribe from events', () => {
      const handler = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.on('auth:login', handler);
      eventBus.off('auth:login', handler);
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const handler = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      const unsubscribe = eventBus.on('auth:login', handler);
      unsubscribe();
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should subscribe and auto-unsubscribe after first emission', () => {
      const handler = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.once('auth:login', handler);
      eventBus.emit('auth:login', payload, 'auth-mfe');
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const handler = jest.fn();
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      const unsubscribe = eventBus.once('auth:login', handler);
      unsubscribe();
      eventBus.emit('auth:login', payload, 'auth-mfe');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('event history', () => {
    it('should store emitted events in history', () => {
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.emit('auth:login', payload, 'auth-mfe');

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        type: 'auth:login',
        payload,
        meta: expect.objectContaining({
          source: 'auth-mfe',
        }),
      });
    });

    it('should maintain max history size', () => {
      const smallEventBus = createEventBus(5);

      for (let i = 0; i < 10; i++) {
        smallEventBus.emit(
          'system:error',
          { error: { code: 'TEST', message: `Error ${i}` } },
          'shell'
        );
      }

      const history = smallEventBus.getHistory();
      expect(history).toHaveLength(5);
    });

    it('should clear history', () => {
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.emit('auth:login', payload, 'auth-mfe');
      eventBus.clearHistory();

      const history = eventBus.getHistory();
      expect(history).toHaveLength(0);
    });

    it('should return a copy of history to prevent external modifications', () => {
      const payload: AuthLoginPayload = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      eventBus.emit('auth:login', payload, 'auth-mfe');

      const history1 = eventBus.getHistory();
      const history2 = eventBus.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('getListenerCount', () => {
    it('should return the number of listeners for an event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      expect(eventBus.getListenerCount('auth:login')).toBe(0);

      eventBus.on('auth:login', handler1);
      expect(eventBus.getListenerCount('auth:login')).toBe(1);

      eventBus.on('auth:login', handler2);
      expect(eventBus.getListenerCount('auth:login')).toBe(2);

      eventBus.off('auth:login', handler1);
      expect(eventBus.getListenerCount('auth:login')).toBe(1);
    });
  });

  describe('getEventTypes', () => {
    it('should return all event types with listeners', () => {
      const handler = jest.fn();

      eventBus.on('auth:login', handler);
      eventBus.on('auth:logout', handler);

      const eventTypes = eventBus.getEventTypes();
      expect(eventTypes).toContain('auth:login');
      expect(eventTypes).toContain('auth:logout');
      expect(eventTypes).toHaveLength(2);
    });
  });

  describe('type safety', () => {
    it('should enforce correct payload types', () => {
      const handler = jest.fn<(payload: PaymentCreatedPayload) => void>();
      const payload: PaymentCreatedPayload = {
        payment: {
          id: '1',
          userId: 'user1',
          amount: 100,
          currency: 'USD',
          status: 'completed',
          type: 'payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      eventBus.on('payments:created', handler);
      eventBus.emit('payments:created', payload, 'payments-mfe');

      expect(handler).toHaveBeenCalledWith(
        payload,
        expect.objectContaining({
          source: 'payments-mfe',
        })
      );
    });
  });
});
