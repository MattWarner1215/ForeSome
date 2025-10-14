'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faTimes, faCheck, faCheckDouble, faUsers, faInfoCircle, faCommentDots, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LOGO_IMAGES } from '@/lib/images'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: string | null
  sender?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  match?: {
    id: string
    title: string
    course: string
    date: string
    time: string
  }
  group?: {
    id: string
    name: string
  }
}

interface NotificationResponse {
  notifications: Notification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch notifications
  const { data: notificationData, isLoading } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=10')
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Empty response from server')
      }

      try {
        return JSON.parse(text)
      } catch (error) {
        console.error('Failed to parse notifications JSON:', text)
        throw new Error('Invalid JSON response from server')
      }
    },
    staleTime: 5000, // Cache for 5 seconds to avoid constant refetching
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 5000, // Reduced frequency to every 5 seconds
    refetchIntervalInBackground: false // Don't refetch when tab is not active
  })

  // Mark notifications as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })
      if (!response.ok) throw new Error('Failed to mark notifications as read')

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Empty response from server')
      }

      try {
        return JSON.parse(text)
      } catch (error) {
        console.error('Failed to parse mark as read JSON:', text)
        throw new Error('Invalid JSON response from server')
      }
    },
    onMutate: async (notificationIds: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot the previous value for rollback
      const previousNotifications = queryClient.getQueryData<NotificationResponse>(['notifications'])

      // Optimistically update notifications to mark as read
      if (previousNotifications) {
        const updatedNotifications = {
          ...previousNotifications,
          notifications: previousNotifications.notifications.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          ),
          unreadCount: Math.max(0, previousNotifications.unreadCount - notificationIds.length)
        }
        queryClient.setQueryData(['notifications'], updatedNotifications)
      }

      return { previousNotifications }
    },
    onError: (err, notificationIds, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications)
      }
    },
    onSettled: () => {
      // Invalidate and refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      if (!response.ok) throw new Error('Failed to mark all notifications as read')

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Empty response from server')
      }

      try {
        return JSON.parse(text)
      } catch (error) {
        console.error('Failed to parse mark all as read JSON:', text)
        throw new Error('Invalid JSON response from server')
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot the previous value for rollback
      const previousNotifications = queryClient.getQueryData<NotificationResponse>(['notifications'])

      // Optimistically mark all notifications as read
      if (previousNotifications) {
        const updatedNotifications = {
          ...previousNotifications,
          notifications: previousNotifications.notifications.map(notification =>
            ({ ...notification, isRead: true })
          ),
          unreadCount: 0
        }
        queryClient.setQueryData(['notifications'], updatedNotifications)
      }

      return { previousNotifications }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications)
      }
    },
    onSettled: () => {
      // Invalidate and refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      if (!response.ok) throw new Error('Failed to delete notification')

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Empty response from server')
      }

      try {
        return JSON.parse(text)
      } catch (error) {
        console.error('Failed to parse delete notification JSON:', text)
        throw new Error('Invalid JSON response from server')
      }
    },
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot the previous value for rollback
      const previousNotifications = queryClient.getQueryData<NotificationResponse>(['notifications'])

      // Optimistically remove notification
      if (previousNotifications) {
        const notificationToDelete = previousNotifications.notifications.find(n => n.id === notificationId)
        const updatedNotifications = {
          ...previousNotifications,
          notifications: previousNotifications.notifications.filter(notification =>
            notification.id !== notificationId
          ),
          unreadCount: notificationToDelete && !notificationToDelete.isRead
            ? Math.max(0, previousNotifications.unreadCount - 1)
            : previousNotifications.unreadCount
        }
        queryClient.setQueryData(['notifications'], updatedNotifications)
      }

      return { previousNotifications }
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications)
      }
    },
    onSettled: () => {
      // Invalidate and refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setDropdownPosition({
        top: rect.bottom + scrollTop + 8, // 8px gap
        right: window.innerWidth - rect.right
      })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate([notificationId])
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate([notification.id])
    }

    // Parse metadata if available
    let metadata = null
    try {
      if (notification.metadata) {
        metadata = JSON.parse(notification.metadata)
      }
    } catch (error) {
      console.error('Failed to parse notification metadata:', error)
    }

    // Navigate based on notification type
    if (notification.type === 'chat_message' && notification.match?.id) {
      // Navigate to the match page which contains the chat
      router.push(`/matches/${notification.match.id}`)
      setIsOpen(false)
    } else if (notification.match?.id) {
      // For other match-related notifications, also go to match page
      router.push(`/matches/${notification.match.id}`)
      setIsOpen(false)
    } else if (notification.group?.id) {
      // For group-related notifications, go to groups page
      router.push('/groups')
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'join_request':
      case 'join_approved':
      case 'join_declined':
        return faUsers
      case 'match_update':
        return faInfoCircle // This won't be used since we handle it specially
      case 'chat_message':
        return faCommentDots
      default:
        return faInfoCircle
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'join_request':
        return 'text-blue-600 bg-blue-50'
      case 'join_approved':
        return 'text-green-600 bg-green-50'
      case 'join_declined':
        return 'text-red-600 bg-red-50'
      case 'match_update':
        return 'text-orange-600 bg-orange-50'
      case 'chat_message':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    // Return a placeholder on server to prevent hydration mismatch
    if (typeof window === 'undefined') return '...'

    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const unreadCount = notificationData?.unreadCount || 0
  const notifications = notificationData?.notifications || []


  return (
    <>
      <Button
        ref={buttonRef}
        size="sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isOpen) {
            updateDropdownPosition()
          }
          setIsOpen(!isOpen)
        }}
        className="relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {mounted && isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            <Card className="w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-green-800">Notifications</CardTitle>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMarkAllAsRead}
                        className="text-xs h-7 px-2 text-green-700 hover:bg-green-100 hover:text-green-800 transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faCheckDouble} className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="h-7 w-7 p-0 text-gray-500 hover:bg-green-100 hover:text-green-700 transition-all duration-200"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`p-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 relative border-l-4 ${
                          !notification.isRead
                            ? 'bg-blue-50/80 border-l-blue-500 shadow-sm'
                            : 'bg-white border-l-transparent hover:border-l-gray-300'
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${index === notifications.length - 1 ? 'rounded-b-lg' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${getNotificationColor(notification.type)}`}>
                              {notification.type === 'match_update' && notification.match ? (
                                <img
                                  src={LOGO_IMAGES[notification.match.course as keyof typeof LOGO_IMAGES] || '/images/default-logo.png'}
                                  alt={notification.match.course}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={getNotificationIcon(notification.type)}
                                  className="h-5 w-5"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 mb-3 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-400">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                                {notification.sender && (
                                  <span className="text-xs text-gray-500">
                                    from {notification.sender.name || notification.sender.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 mt-1">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                                className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-700"
                              >
                                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notification.id)
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>,
          document.body
        )
      }
    </>
  )
}