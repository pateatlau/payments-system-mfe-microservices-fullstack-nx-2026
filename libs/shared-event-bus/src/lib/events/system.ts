/**
 * System Events
 *
 * Event definitions for system-level operations
 * Emitted by Shell (host application)
 */

import { BaseEvent } from '../types';

/**
 * System error event payload
 * Emitted when a system-level error occurs
 */
export interface SystemErrorPayload {
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * System navigation event payload
 * Emitted when navigation occurs
 */
export interface SystemNavigationPayload {
  from: string;
  to: string;
  userId?: string;
}

/**
 * System events union type
 */
export type SystemEvent =
  | (BaseEvent<SystemErrorPayload> & { type: 'system:error' })
  | (BaseEvent<SystemNavigationPayload> & { type: 'system:navigation' });

/**
 * System event type strings
 */
export type SystemEventType = SystemEvent['type'];
