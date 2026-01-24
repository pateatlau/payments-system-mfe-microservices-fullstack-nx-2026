import { renderHook, act } from '@testing-library/react';
import { useAnnounce } from './useAnnounce';

describe('useAnnounce', () => {
  beforeEach(() => {
    // Clean up any existing announcer elements
    const polite = document.getElementById('a11y-announcer-polite');
    const assertive = document.getElementById('a11y-announcer-assertive');
    if (polite) polite.remove();
    if (assertive) assertive.remove();

    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates live regions on mount', () => {
    renderHook(() => useAnnounce());

    const politeRegion = document.getElementById('a11y-announcer-polite');
    const assertiveRegion = document.getElementById('a11y-announcer-assertive');

    expect(politeRegion).toBeInTheDocument();
    expect(assertiveRegion).toBeInTheDocument();
  });

  it('creates polite region with correct attributes', () => {
    renderHook(() => useAnnounce());

    const politeRegion = document.getElementById('a11y-announcer-polite');

    expect(politeRegion).toHaveAttribute('role', 'status');
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('creates assertive region with correct attributes', () => {
    renderHook(() => useAnnounce());

    const assertiveRegion = document.getElementById('a11y-announcer-assertive');

    expect(assertiveRegion).toHaveAttribute('role', 'alert');
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces polite message by default', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Test message');
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('Test message');
  });

  it('announces assertive message when specified', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Urgent message', { politeness: 'assertive' });
      jest.advanceTimersByTime(50);
    });

    const assertiveRegion = document.getElementById('a11y-announcer-assertive');
    expect(assertiveRegion?.textContent).toBe('Urgent message');
  });

  it('clears message after default timeout', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Temporary message');
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('Temporary message');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(politeRegion?.textContent).toBe('');
  });

  it('clears message after custom timeout', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Custom timeout message', { clearAfter: 500 });
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('Custom timeout message');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(politeRegion?.textContent).toBe('');
  });

  it('does not clear message when clearAfter is 0', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Persistent message', { clearAfter: 0 });
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('Persistent message');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(politeRegion?.textContent).toBe('Persistent message');
  });

  it('reuses existing live regions', () => {
    // First hook creates the regions
    const { unmount } = renderHook(() => useAnnounce());
    unmount();

    // Second hook should reuse them
    renderHook(() => useAnnounce());

    const politeRegions = document.querySelectorAll('#a11y-announcer-polite');
    const assertiveRegions = document.querySelectorAll(
      '#a11y-announcer-assertive'
    );

    expect(politeRegions.length).toBe(1);
    expect(assertiveRegions.length).toBe(1);
  });

  it('clears previous message before announcing new one', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('First message');
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('First message');

    act(() => {
      result.current('Second message');
      // Content should be cleared immediately before timeout
    });

    expect(politeRegion?.textContent).toBe('');

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(politeRegion?.textContent).toBe('Second message');
  });

  it('can announce same message multiple times', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Repeated message');
      jest.advanceTimersByTime(50);
    });

    const politeRegion = document.getElementById('a11y-announcer-polite');
    expect(politeRegion?.textContent).toBe('Repeated message');

    // Clear and re-announce same message
    act(() => {
      result.current('Repeated message');
    });

    expect(politeRegion?.textContent).toBe('');

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(politeRegion?.textContent).toBe('Repeated message');
  });

  it('applies sr-only styles to hide regions visually', () => {
    renderHook(() => useAnnounce());

    const politeRegion = document.getElementById('a11y-announcer-polite');
    const assertiveRegion = document.getElementById('a11y-announcer-assertive');

    expect(politeRegion?.style.position).toBe('absolute');
    expect(politeRegion?.style.width).toBe('1px');
    expect(politeRegion?.style.height).toBe('1px');
    expect(politeRegion?.style.overflow).toBe('hidden');

    expect(assertiveRegion?.style.position).toBe('absolute');
    expect(assertiveRegion?.style.width).toBe('1px');
  });

  it('returns stable announce function reference', () => {
    const { result, rerender } = renderHook(() => useAnnounce());

    const firstAnnounce = result.current;
    rerender();
    const secondAnnounce = result.current;

    expect(firstAnnounce).toBe(secondAnnounce);
  });
});
