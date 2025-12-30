import { act, renderHook } from '@testing-library/react';
import { useToasts } from './useToasts';

describe('useToasts', () => {
  test('adds and removes toasts', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast({ message: 'Created', variant: 'success' });
    });

    expect(result.current.toasts).toHaveLength(1);
    const id = result.current.toasts[0]?.id as string;

    act(() => {
      result.current.removeToast(id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  test('clears all toasts', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast({ message: 'One' });
      result.current.addToast({ message: 'Two' });
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
