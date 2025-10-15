import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh, no refetch needed
      gcTime: 1000 * 60 * 30, // 30 minutes - keep unused data in cache longer
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus (prevents flash)
      refetchOnMount: false, // Don't refetch if data is fresh (prevents flash on remount)
      refetchOnReconnect: false, // Don't refetch on network reconnection (prevents flash)
      // Keep previous data while fetching new data (prevents flash during updates)
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 0, // Don't retry mutations to avoid duplicate operations
    },
  },
});
