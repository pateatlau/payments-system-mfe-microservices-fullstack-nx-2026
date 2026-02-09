import { useCallback, useEffect, useRef } from 'react';

type Politeness = 'polite' | 'assertive';

export interface AnnounceOptions {
  /** Urgency level: 'polite' waits for pause, 'assertive' interrupts */
  politeness?: Politeness;
  /** Clear announcement after this delay (ms). Set to 0 to never clear. Default: 1000 */
  clearAfter?: number;
}

/**
 * Hook for making screen reader announcements via ARIA live regions.
 *
 * Creates and manages two live regions in the DOM:
 * - A 'polite' region that waits for a pause in speech
 * - An 'assertive' region that interrupts current speech
 *
 * @example
 * const announce = useAnnounce();
 *
 * const handleSubmit = async () => {
 *   announce('Submitting form...');
 *   await submitForm();
 *   announce('Form submitted successfully', { politeness: 'assertive' });
 * };
 *
 * @returns A function to announce messages to screen readers
 */
export function useAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Create or find existing live regions
    let politeRegion = document.getElementById(
      'a11y-announcer-polite'
    ) as HTMLDivElement | null;
    let assertiveRegion = document.getElementById(
      'a11y-announcer-assertive'
    ) as HTMLDivElement | null;

    if (!politeRegion) {
      politeRegion = document.createElement('div');
      politeRegion.id = 'a11y-announcer-polite';
      politeRegion.setAttribute('role', 'status');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      // sr-only styles - visually hidden but accessible to screen readers
      politeRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(politeRegion);
    }

    if (!assertiveRegion) {
      assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'a11y-announcer-assertive';
      assertiveRegion.setAttribute('role', 'alert');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      // sr-only styles - visually hidden but accessible to screen readers
      assertiveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(assertiveRegion);
    }

    politeRef.current = politeRegion;
    assertiveRef.current = assertiveRegion;

    return () => {
      // Clear any pending timeouts on unmount
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      if (setMessageTimeoutRef.current) {
        clearTimeout(setMessageTimeoutRef.current);
      }
      // Don't remove regions - other components may use them
    };
  }, []);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const { politeness = 'polite', clearAfter = 1000 } = options;
      const region =
        politeness === 'assertive' ? assertiveRef.current : politeRef.current;

      if (!region) return;

      // Clear any pending timeouts
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
      if (setMessageTimeoutRef.current) {
        clearTimeout(setMessageTimeoutRef.current);
        setMessageTimeoutRef.current = null;
      }

      // Clear first to ensure re-announcement of same message
      region.textContent = '';

      // Use setTimeout to ensure DOM update triggers announcement
      // This is necessary because screen readers may not detect
      // changes if the content is set synchronously
      setMessageTimeoutRef.current = setTimeout(() => {
        region.textContent = message;

        // Clear after delay to prevent stale content
        // Schedule this after message is written to avoid race conditions
        if (clearAfter > 0) {
          clearTimeoutRef.current = setTimeout(() => {
            if (region.textContent === message) {
              region.textContent = '';
            }
          }, clearAfter);
        }
      }, 50);
    },
    []
  );

  return announce;
}

export type AnnounceFunction = ReturnType<typeof useAnnounce>;
