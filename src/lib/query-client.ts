import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - more aggressive caching
      gcTime: 10 * 60 * 1000,   // 10 minutes - keep cached data longer
      refetchOnWindowFocus: false,
      refetchOnMount: false,    // Don't refetch on mount if data exists
      refetchOnReconnect: true, // Only refetch on network reconnect
      retry: (failureCount, error) => {
        // Smart retry logic - don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('40')) {
          return false
        }
        return failureCount < 2
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable background updates for better UX
      refetchInterval: false,
      refetchIntervalInBackground: false,
      // Performance optimizations
      structuralSharing: true,  // Prevent unnecessary re-renders
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})