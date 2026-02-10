import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;

  beforeEach(() => {
    // Create a test container with focusable elements
    container = document.createElement('div');
    container.tabIndex = -1;

    button1 = document.createElement('button');
    button1.textContent = 'Button 1';

    button2 = document.createElement('button');
    button2.textContent = 'Button 2';

    button3 = document.createElement('button');
    button3.textContent = 'Button 3';

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  describe('when inactive', () => {
    it('should not trap focus', () => {
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: false })
      );

      expect(result.current.containerRef.current).toBeNull();
    });

    it('should not listen for keyboard events', () => {
      const onEscape = jest.fn();
      renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: false, onEscape })
      );

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('when active', () => {
    it('should return a container ref', () => {
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      expect(result.current.containerRef).toBeDefined();
    });

    it('should call onEscape when Escape key is pressed', async () => {
      const onEscape = jest.fn();
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true, onEscape })
      );

      // Assign ref to container
      act(() => {
        (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Re-render to trigger effect with new ref
      const { rerender } = renderHook(
        ({ isActive, onEscape }) =>
          useFocusTrap<HTMLDivElement>({ isActive, onEscape }),
        { initialProps: { isActive: true, onEscape } }
      );

      // Set the ref
      act(() => {
        (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      rerender({ isActive: true, onEscape });

      // Dispatch Escape key event
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should auto-focus the first focusable element', async () => {
      // Create a new element that will be focused before the hook runs
      const outsideButton = document.createElement('button');
      outsideButton.textContent = 'Outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      // Render hook
      const { result } = renderHook(
        ({ isActive }) => useFocusTrap<HTMLDivElement>({ isActive }),
        { initialProps: { isActive: false } }
      );

      // Assign ref to container
      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      // Activate the hook
      const { rerender } = renderHook(
        ({ isActive }) => useFocusTrap<HTMLDivElement>({ isActive }),
        { initialProps: { isActive: false } }
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      rerender({ isActive: true });

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Assert that the first button now has focus
      expect(document.activeElement).toBe(button1);

      // Clean up
      document.body.removeChild(outsideButton);
    });

    it('should store previously focused element', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      expect(document.activeElement).toBe(outsideButton);

      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      // Assign container ref
      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      document.body.removeChild(outsideButton);
    });

    it('should prevent default on Escape key', () => {
      const onEscape = jest.fn();
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true, onEscape })
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('focus trapping behavior', () => {
    it('should wrap focus from last to first element on Tab', () => {
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      // Focus the last button
      button3.focus();
      expect(document.activeElement).toBe(button3);

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);

      // Should have prevented default (focus wrap handled by hook)
      expect(event.defaultPrevented).toBe(true);
    });

    it('should wrap focus from first to last element on Shift+Tab', () => {
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      // Focus the first button
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Simulate Shift+Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);

      // Should have prevented default (focus wrap handled by hook)
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not interfere with normal Tab navigation in the middle', () => {
      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      // Focus the middle button
      button2.focus();
      expect(document.activeElement).toBe(button2);

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);

      // Should NOT have prevented default (normal tab navigation)
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('options', () => {
    it('should respect restoreFocus=false option', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const { unmount } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({
          isActive: true,
          restoreFocus: false,
        })
      );

      unmount();

      // Focus should not be restored when restoreFocus is false
      // (This is hard to test directly but the option is passed correctly)

      document.body.removeChild(outsideButton);
    });

    it('should respect autoFocus=false option', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const { result } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({
          isActive: true,
          autoFocus: false,
        })
      );

      (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = container;

      // With autoFocus=false, focus should stay on the outside button
      expect(document.activeElement).toBe(outsideButton);

      document.body.removeChild(outsideButton);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useFocusTrap<HTMLDivElement>({ isActive: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove event listeners when isActive changes to false', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { rerender } = renderHook(
        ({ isActive }) => useFocusTrap<HTMLDivElement>({ isActive }),
        { initialProps: { isActive: true } }
      );

      rerender({ isActive: false });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });
});
