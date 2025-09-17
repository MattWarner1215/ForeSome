import { QueryClient } from '@tanstack/react-query'

/**
 * Utility functions for efficiently invalidating related queries
 * to provide instant UI updates when data changes
 */

export const invalidateMatchQueries = (queryClient: QueryClient) => {
  // Invalidate all match-related queries
  queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
  queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
  queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
  queryClient.invalidateQueries({ queryKey: ['rounds'] })
  queryClient.invalidateQueries({ queryKey: ['matches'] })
  queryClient.invalidateQueries({ queryKey: ['completed-matches'] })
}

export const invalidateNotificationQueries = (queryClient: QueryClient) => {
  // Invalidate notification-related queries
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

export const invalidateGroupQueries = (queryClient: QueryClient) => {
  // Invalidate group-related queries
  queryClient.invalidateQueries({ queryKey: ['user-groups'] })
  queryClient.invalidateQueries({ queryKey: ['groups'] })
}

export const invalidateUserQueries = (queryClient: QueryClient) => {
  // Invalidate user-related queries
  queryClient.invalidateQueries({ queryKey: ['user-stats'] })
  queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
}

export const invalidateAllQueries = (queryClient: QueryClient) => {
  // Nuclear option - invalidate everything for major changes
  queryClient.invalidateQueries()
}

/**
 * Prefetch commonly accessed queries to improve perceived performance
 */
export const prefetchCommonQueries = async (queryClient: QueryClient, userId: string) => {
  // Prefetch notifications
  queryClient.prefetchQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=10')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    },
    staleTime: 5000
  })

  // Prefetch recent rounds
  queryClient.prefetchQuery({
    queryKey: ['recent-rounds'],
    queryFn: async () => {
      const response = await fetch('/api/matches?myMatches=true&limit=10')
      if (!response.ok) throw new Error('Failed to fetch recent rounds')
      return response.json()
    },
    staleTime: 5000
  })
}