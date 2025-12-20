// apps/profile-mfe/src/hooks/useNotification.ts
import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useNotification = () => {
  const { showToast } = useToast();

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  return { showSuccess, showError };
};
