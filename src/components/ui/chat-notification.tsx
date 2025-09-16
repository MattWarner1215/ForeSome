'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'

interface ChatNotificationProps {
  matchId: string
  onOpenChat: () => void
}

export function ChatNotification({ matchId, onOpenChat }: ChatNotificationProps) {
  const { socket, isConnected } = useSocket()
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [latestSender, setLatestSender] = useState<string>('')

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (message: any) => {
      // Don't show notification for own messages
      if (message.senderId === (socket as any).data?.userId) return

      setNewMessageCount(prev => prev + 1)
      setLatestSender(message.senderName || 'Someone')
      setShowNotification(true)
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 5000)
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
    }
  }, [socket, isConnected])

  const handleOpenChat = () => {
    setNewMessageCount(0)
    setShowNotification(false)
    onOpenChat()
  }

  const handleDismiss = () => {
    setShowNotification(false)
  }

  if (!showNotification || !isConnected) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-xs animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon icon={faComments} className="h-5 w-5 mt-0.5 text-green-200" />
            <div>
              <p className="font-medium text-sm">New Message</p>
              <p className="text-xs text-green-100">
                {latestSender} sent {newMessageCount === 1 ? 'a message' : `${newMessageCount} messages`}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-200 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleOpenChat}
            className="bg-white text-green-600 hover:bg-green-50 text-xs px-3 py-1"
          >
            View Chat
          </Button>
        </div>
      </div>
    </div>
  )
}