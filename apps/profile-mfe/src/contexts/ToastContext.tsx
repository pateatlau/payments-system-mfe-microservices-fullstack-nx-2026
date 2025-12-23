// apps/profile-mfe/src/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from '@mfe/shared-design-system';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      duration: number = 5000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prevToasts => [...prevToasts, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed z-50 space-y-2 bottom-4 right-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="animate-fade-in-up"
            onClick={() => removeToast(toast.id)}
          >
            <Alert
              variant={toast.type === 'error' ? 'destructive' : 'default'}
              className="min-w-[300px]"
            >
              <div className="flex items-center justify-between">
                <span>{toast.message}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  className="ml-4 text-sm font-medium hover:opacity-80"
                >
                  Dismiss
                </button>
              </div>
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
