'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faTimes, faCheck, faCheckDouble, faUsers, faInfoCircle, faCommentDots } from '@fortawesome/free-solid-svg-icons'
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Fetch notifications
  const { data: notificationData, isLoading } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=10')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
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
      return response.json()
    },
    onSuccess: () => {
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
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="relative" ref={dropdownRef}>
      <Button
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden bg-white shadow-2xl border-0 rounded-2xl z-50 animate-in slide-in-from-top-2 duration-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMarkAllAsRead}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <FontAwesomeIcon icon={faCheckDouble} className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <FontAwesomeIcon icon={faBell} className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-green-50 hover:border-l-4 hover:border-green-500 transition-all duration-200 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50/30 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      title="Click to view"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {notification.type === 'match_update' ? (
                            <img src={LOGO_IMAGES.myrounds_icon} alt="Match Update" className="h-3 w-3" />
                          ) : (
                            <FontAwesomeIcon
                              icon={getNotificationIcon(notification.type)}
                              className="h-3 w-3"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              {notification.match && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.match.course} • {new Date(notification.match.date).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                                disabled={markAsReadMutation.isPending}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 ml-2"
                              >
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}