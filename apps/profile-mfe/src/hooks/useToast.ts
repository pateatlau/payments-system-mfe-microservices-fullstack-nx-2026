/**
 * useToast Hook
 *
 * Custom hook for managing toast notifications in the Profile MFE
 */

import { useState, useCallback } from 'react';

export interface ToastData {
  id: string;
  title?: string;
  message: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, variant: 'success', duration: 5000 });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, variant: 'error', duration: 5000 });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, variant: 'warning', duration: 5000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, variant: 'info', duration: 5000 });
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
