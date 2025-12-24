import { useCallback, useMemo, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'> & { id?: string }) => {
      const id =
        toast.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const duration = toast.duration ?? 5000; // default auto-close after 5s
      // Add toast with ensured duration
      setToasts(prev => [...prev, { ...toast, id, duration }]);

      // Auto-dismiss after duration
      try {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      } catch {
        // no-op: timer setup should not block toast creation
      }

      return id;
    },
    []
  );

  const clearToasts = useCallback(() => setToasts([]), []);

  return useMemo(
    () => ({ toasts, addToast, removeToast, clearToasts }),
    [toasts, addToast, removeToast, clearToasts]
  );
}
