import { renderHook } from '@testing-library/react';
import { useRouteAnnouncer } from './useRouteAnnouncer';

// Mock useAnnounce
const mockAnnounce = jest.fn();
jest.mock('./useAnnounce', () => ({
  useAnnounce: () => mockAnnounce,
}));

describe('useRouteAnnouncer', () => {
  beforeEach(() => {
    mockAnnounce.mockClear();
    jest.useFakeTimers();
    // Reset document title
    document.title = 'Test App';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not announce on initial mount', () => {
    renderHook(() => useRouteAnnouncer('/home'));

    jest.advanceTimersByTime(200);

    expect(mockAnnounce).not.toHaveBeenCalled();
  });

  it('announces when path changes', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path),
      { initialProps: { path: '/home' } }
    );

    jest.advanceTimersByTime(200);
    expect(mockAnnounce).not.toHaveBeenCalled();

    rerender({ path: '/payments' });

    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Navigated to Test App',
      { politeness: 'polite', clearAfter: 2000 }
    );
  });

  it('does not announce when path is the same', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path),
      { initialProps: { path: '/home' } }
    );

    jest.advanceTimersByTime(200);

    rerender({ path: '/home' }); // Same path
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).not.toHaveBeenCalled();
  });

  it('uses custom prefix', () => {
    document.title = 'Payments Page';

    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path, { prefix: 'Now viewing' }),
      { initialProps: { path: '/home' } }
    );

    rerender({ path: '/payments' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Now viewing Payments Page',
      expect.any(Object)
    );
  });

  it('respects custom delay', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path, { delay: 500 }),
      { initialProps: { path: '/home' } }
    );

    rerender({ path: '/payments' });

    jest.advanceTimersByTime(100);
    expect(mockAnnounce).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    expect(mockAnnounce).toHaveBeenCalled();
  });

  it('formats path as title when useDocumentTitle is false', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path, { useDocumentTitle: false }),
      { initialProps: { path: '/home' } }
    );

    rerender({ path: '/payments/create' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Navigated to Payments Create',
      expect.any(Object)
    );
  });

  it('formats root path as Home', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path, { useDocumentTitle: false }),
      { initialProps: { path: '/about' } }
    );

    rerender({ path: '/' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Navigated to Home',
      expect.any(Object)
    );
  });

  it('handles path with dashes', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path, { useDocumentTitle: false }),
      { initialProps: { path: '/home' } }
    );

    rerender({ path: '/payment-history' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledWith(
      'Navigated to Payment History',
      expect.any(Object)
    );
  });

  it('cleans up timeout on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path),
      { initialProps: { path: '/home' } }
    );

    rerender({ path: '/payments' });
    unmount();

    jest.advanceTimersByTime(200);

    // Should not throw or cause issues
    expect(mockAnnounce).not.toHaveBeenCalled();
  });

  it('announces multiple route changes in sequence', () => {
    const { rerender } = renderHook(
      ({ path }) => useRouteAnnouncer(path),
      { initialProps: { path: '/home' } }
    );

    document.title = 'Payments';
    rerender({ path: '/payments' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledTimes(1);
    expect(mockAnnounce).toHaveBeenLastCalledWith(
      'Navigated to Payments',
      expect.any(Object)
    );

    document.title = 'Admin';
    rerender({ path: '/admin' });
    jest.advanceTimersByTime(200);

    expect(mockAnnounce).toHaveBeenCalledTimes(2);
    expect(mockAnnounce).toHaveBeenLastCalledWith(
      'Navigated to Admin',
      expect.any(Object)
    );
  });
});
