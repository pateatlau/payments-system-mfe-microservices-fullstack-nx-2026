import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Selector for all focusable elements within a container.
 * Excludes disabled elements and those with tabindex="-1".
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is currently active.
   * When false, no focus trapping occurs.
   */
  isActive: boolean;

  /**
   * Callback fired when Escape key is pressed.
   * Use this to close the modal/dialog.
   */
  onEscape?: () => void;

  /**
   * Whether to return focus to the previously focused element when deactivating.
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Whether to focus the first focusable element when activating.
   * @default true
   */
  autoFocus?: boolean;
}

export interface UseFocusTrapReturn<T extends HTMLElement> {
  /**
   * Ref to attach to the container element that should trap focus.
   */
  containerRef: RefObject<T>;
}

/**
 * Hook for trapping focus within a container element.
 *
 * This is essential for accessibility compliance (WCAG 2.1 AA) when
 * displaying modal dialogs. It ensures keyboard users cannot tab
 * outside the dialog while it's open.
 *
 * Features:
 * - Traps Tab/Shift+Tab navigation within the container
 * - Handles Escape key to close via onEscape callback
 * - Auto-focuses first focusable element on activation
 * - Restores focus to previously focused element on deactivation
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const { containerRef } = useFocusTrap<HTMLDivElement>({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div
 *       ref={containerRef}
 *       role="dialog"
 *       aria-modal="true"
 *       tabIndex={-1}
 *     >
 *       <button onClick={onClose}>Close</button>
 *       <p>Modal content</p>
 *     </div>
 *   );
 * }
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions
): UseFocusTrapReturn<T> {
  const { isActive, onEscape, restoreFocus = true, autoFocus = true } = options;

  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  // Update onEscape ref whenever it changes
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element to restore later
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Auto-focus first focusable element
    let rafId: number | null = null;
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      const firstFocusable = focusableElements[0];
      if (firstFocusable) {
        // Use requestAnimationFrame to ensure the modal is rendered
        rafId = requestAnimationFrame(() => {
          firstFocusable.focus();
        });
      } else if (containerRef.current) {
        // If no focusable elements, focus the container itself
        containerRef.current.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      // Only trap Tab key
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        // Shift+Tab: if on first element or container, go to last
        if (
          activeElement === firstFocusable ||
          activeElement === containerRef.current
        ) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Cancel pending RAF if cleanup happens before it executes
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Restore focus to previously focused element
      if (restoreFocus && previouslyFocusedRef.current) {
        // Use setTimeout to ensure this happens after modal is removed from DOM
        setTimeout(() => {
          previouslyFocusedRef.current?.focus?.();
        }, 0);
      }
    };
  }, [isActive, restoreFocus, autoFocus, getFocusableElements]);

  return { containerRef };
}
