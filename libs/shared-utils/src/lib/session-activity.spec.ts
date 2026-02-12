/**
 * Session Activity Monitor Tests
 *
 * POC-3 Phase 7.4: Tests for session activity monitoring functionality.
 */

import {
  SessionActivityMonitor,
  createSessionActivityMonitor,
  formatTimeRemaining,
  SESSION_TIMEOUT_PRESETS,
  SESSION_WARNING_PRESETS,
} from './session-activity';

describe('SessionActivityMonitor', () => {
  let monitor: SessionActivityMonitor;
  let mockCallbacks: {
    onWarning: jest.Mock;
    onWarningDismissed: jest.Mock;
    onTimeout: jest.Mock;
    onActivity: jest.Mock;
    onExtend: jest.Mock;
  };
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock callbacks
    mockCallbacks = {
      onWarning: jest.fn(),
      onWarningDismissed: jest.fn(),
      onTimeout: jest.fn(),
      onActivity: jest.fn(),
      onExtend: jest.fn(),
    };

    // Mock localStorage
    mockStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          mockStorage = {};
        }),
      },
      writable: true,
      configurable: true,
    });

    // Create monitor with short timeouts for testing
    monitor = new SessionActivityMonitor(
      {
        idleTimeout: 5000, // 5 seconds
        warningTime: 2000, // 2 seconds before
        activityThrottle: 100, // 100ms throttle for testing
        enableCrossTabSync: false, // Disable for unit tests
      },
      mockCallbacks
    );
  });

  afterEach(() => {
    monitor.stop();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('start/stop', () => {
    it('should start monitoring session activity', () => {
      monitor.start();
      const state = monitor.getState();

      expect(state.isActive).toBe(true);
      expect(state.lastActivity).toBeGreaterThan(0);
    });

    it('should stop monitoring session activity', () => {
      monitor.start();
      monitor.stop();
      const state = monitor.getState();

      expect(state.isActive).toBe(false);
    });

    it('should not start twice', () => {
      monitor.start();
      const firstActivity = monitor.getState().lastActivity;

      // Advance time and start again
      jest.advanceTimersByTime(1000);
      monitor.start();

      // Activity should remain from first start (not reset)
      expect(monitor.getState().lastActivity).toBe(firstActivity);
    });

    it('should call onActivity when started', () => {
      monitor.start();
      expect(mockCallbacks.onActivity).toHaveBeenCalled();
    });
  });

  describe('activity tracking', () => {
    it('should record activity timestamp', () => {
      monitor.start();
      const initialActivity = monitor.getState().lastActivity;

      // Advance past throttle period
      jest.advanceTimersByTime(200);

      // Simulate activity
      window.dispatchEvent(new MouseEvent('mousedown'));

      const newActivity = monitor.getState().lastActivity;
      expect(newActivity).toBeGreaterThan(initialActivity);
    });

    it('should throttle activity updates', () => {
      monitor.start();
      const initialActivity = monitor.getState().lastActivity;
      mockCallbacks.onActivity.mockClear();

      // Rapid events within throttle period
      window.dispatchEvent(new MouseEvent('mousedown'));
      window.dispatchEvent(new MouseEvent('mousedown'));
      window.dispatchEvent(new MouseEvent('mousedown'));

      // Only one call due to throttling
      expect(mockCallbacks.onActivity).toHaveBeenCalledTimes(0); // Throttled
    });

    it('should save activity to localStorage', () => {
      monitor.start();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mfe-last-activity',
        expect.any(String)
      );
    });
  });

  describe('timeout handling', () => {
    it('should show warning before timeout', () => {
      monitor.start();

      // Advance to warning time (5000 - 2000 = 3000ms until warning)
      jest.advanceTimersByTime(3500);

      expect(mockCallbacks.onWarning).toHaveBeenCalled();
      expect(monitor.getState().isWarningShown).toBe(true);
    });

    it('should call onTimeout when session expires', () => {
      monitor.start();

      // Advance past timeout
      jest.advanceTimersByTime(5500);

      expect(mockCallbacks.onTimeout).toHaveBeenCalled();
    });

    it('should stop monitoring after timeout', () => {
      monitor.start();

      // Advance past timeout
      jest.advanceTimersByTime(5500);

      expect(monitor.getState().isActive).toBe(false);
    });

    it('should include time remaining in warning callback', () => {
      monitor.start();

      // Advance to just before warning threshold
      jest.advanceTimersByTime(3100);

      expect(mockCallbacks.onWarning).toHaveBeenCalledWith(
        expect.any(Number)
      );

      // Time remaining should be around 2000ms or less
      const timeRemaining = mockCallbacks.onWarning.mock.calls[0][0];
      expect(timeRemaining).toBeLessThanOrEqual(2000);
      expect(timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('session extension', () => {
    it('should extend session and reset timeout', () => {
      monitor.start();

      // Advance to warning
      jest.advanceTimersByTime(3500);
      expect(monitor.getState().isWarningShown).toBe(true);

      // Extend session
      monitor.extend();

      expect(mockCallbacks.onExtend).toHaveBeenCalled();
      expect(monitor.getState().isWarningShown).toBe(false);
      expect(mockCallbacks.onWarningDismissed).toHaveBeenCalled();
    });

    it('should dismiss warning on activity', () => {
      monitor.start();

      // Advance to warning
      jest.advanceTimersByTime(3500);
      expect(monitor.getState().isWarningShown).toBe(true);

      // Simulate activity (past throttle)
      jest.advanceTimersByTime(150);
      window.dispatchEvent(new MouseEvent('mousedown'));

      expect(monitor.getState().isWarningShown).toBe(false);
      expect(mockCallbacks.onWarningDismissed).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      monitor.start();
      const state = monitor.getState();

      expect(state).toHaveProperty('lastActivity');
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('isWarningShown');
      expect(state).toHaveProperty('timeRemaining');
      expect(state).toHaveProperty('isTimedOut');
    });

    it('should calculate correct time remaining', () => {
      monitor.start();

      jest.advanceTimersByTime(2000);
      const state = monitor.getState();

      // Should have approximately 3000ms remaining (5000 - 2000)
      expect(state.timeRemaining).toBeLessThanOrEqual(3000);
      expect(state.timeRemaining).toBeGreaterThanOrEqual(2900);
    });

    it('should show timed out when time remaining is 0', () => {
      monitor.start();

      // Force timeout
      jest.advanceTimersByTime(5500);
      const state = monitor.getState();

      expect(state.timeRemaining).toBe(0);
      expect(state.isTimedOut).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use custom idle timeout', () => {
      const customMonitor = new SessionActivityMonitor(
        {
          idleTimeout: 10000,
          warningTime: 3000,
          enableCrossTabSync: false,
        },
        { onWarning: mockCallbacks.onWarning }
      );

      customMonitor.start();

      // Advance to warning (10000 - 3000 = 7000ms)
      jest.advanceTimersByTime(7500);

      expect(mockCallbacks.onWarning).toHaveBeenCalled();

      customMonitor.stop();
    });

    it('should update configuration', () => {
      monitor.start();

      monitor.updateConfig({ warningTime: 1000 });

      // Clear warning callback
      mockCallbacks.onWarning.mockClear();

      // Advance to new warning time (5000 - 1000 = 4000ms)
      jest.advanceTimersByTime(4500);

      expect(mockCallbacks.onWarning).toHaveBeenCalled();
    });
  });
});

describe('createSessionActivityMonitor', () => {
  it('should create a monitor instance', () => {
    const monitor = createSessionActivityMonitor();
    expect(monitor).toBeInstanceOf(SessionActivityMonitor);
    monitor.stop();
  });

  it('should accept custom config', () => {
    const monitor = createSessionActivityMonitor({
      idleTimeout: 30000,
    });
    expect(monitor).toBeInstanceOf(SessionActivityMonitor);
    monitor.stop();
  });
});

describe('formatTimeRemaining', () => {
  it('should format minutes and seconds', () => {
    expect(formatTimeRemaining(120000)).toBe('2:00');
    expect(formatTimeRemaining(90000)).toBe('1:30');
    expect(formatTimeRemaining(65000)).toBe('1:05');
  });

  it('should format seconds only when under 1 minute', () => {
    expect(formatTimeRemaining(45000)).toBe('45 seconds');
    expect(formatTimeRemaining(10000)).toBe('10 seconds');
    expect(formatTimeRemaining(1000)).toBe('1 seconds');
  });

  it('should handle expired time', () => {
    expect(formatTimeRemaining(0)).toBe('Session expired');
    expect(formatTimeRemaining(-1000)).toBe('Session expired');
  });

  it('should pad seconds correctly', () => {
    expect(formatTimeRemaining(61000)).toBe('1:01');
    expect(formatTimeRemaining(69000)).toBe('1:09');
  });
});

describe('SESSION_TIMEOUT_PRESETS', () => {
  it('should have correct preset values', () => {
    expect(SESSION_TIMEOUT_PRESETS.strict).toBe(5 * 60 * 1000);
    expect(SESSION_TIMEOUT_PRESETS.standard).toBe(15 * 60 * 1000);
    expect(SESSION_TIMEOUT_PRESETS.relaxed).toBe(30 * 60 * 1000);
    expect(SESSION_TIMEOUT_PRESETS.extended).toBe(60 * 60 * 1000);
  });
});

describe('SESSION_WARNING_PRESETS', () => {
  it('should have correct preset values', () => {
    expect(SESSION_WARNING_PRESETS.short).toBe(30 * 1000);
    expect(SESSION_WARNING_PRESETS.minute).toBe(60 * 1000);
    expect(SESSION_WARNING_PRESETS.standard).toBe(2 * 60 * 1000);
    expect(SESSION_WARNING_PRESETS.long).toBe(5 * 60 * 1000);
  });
});
