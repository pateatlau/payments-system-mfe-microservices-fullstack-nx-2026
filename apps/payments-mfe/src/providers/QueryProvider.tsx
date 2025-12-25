import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

/**
 * QueryClient configuration
 * Configured with appropriate staleTime and cacheTime for payment data
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - payments data is relatively stable
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});

/**
 * QueryProvider component
 * Wraps the app with TanStack Query provider
 */
export interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default QueryProvider;
