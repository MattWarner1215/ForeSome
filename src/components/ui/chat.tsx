'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner, faComments, faUsers, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import { useSocket } from '@/contexts/socket-context'
import { ChatMessage } from '@/lib/socket'
import { ChatDemo } from './chat-demo'
import { formatDistanceToNow } from 'date-fns'

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface ChatProps {
  matchId: string
  matchTitle?: string
  isOpen?: boolean
  onToggle?: () => void
}

interface ChatRoom {
  id: string
  matchId: string
  isActive: boolean
  messages: Array<{
    id: string
    content: string
    senderId: string
    messageType: string
    createdAt: string
    sender: {
      id: string
      name: string | null
      image: string | null
    }
  }>
  match: {
    id: string
    title: string
    course: string
    date: string
    time: string
    creator: {
      id: string
      name: string | null
      image: string | null
    }
    players: Array<{
      player: {
        id: string
        name: string | null
        image: string | null
      }
    }>
  }
}

export function Chat({ matchId, matchTitle, isOpen = true, onToggle }: ChatProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [lastTypingTime, setLastTypingTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const { data: chatRoom, isLoading, error } = useQuery<ChatRoom>({
    queryKey: ['chatRoom', matchId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/rooms?matchId=${matchId}`)
      if (!response.ok) {
        if (response.status === 404) {
          // Create chat room if it doesn't exist
          const createResponse = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId })
          })
          if (!createResponse.ok) throw new Error('Failed to create chat room')
          return createResponse.json()
        }
        throw new Error('Failed to fetch chat room')
      }
      return response.json()
    },
    enabled: !!session?.user?.id && !!matchId,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider chat data stale for real-time updates
    gcTime: 1000 * 60 * 5 // Keep in cache for 5 minutes
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatRoom?.id) throw new Error('No chat room available')
      
      if (socket && isConnected) {
        socket.emit('message:send', { content, chatRoomId: chatRoom.id })
      } else {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatRoomId: chatRoom.id, content })
        })
        if (!response.ok) throw new Error('Failed to send message')
        return response.json()
      }
    },
    onSuccess: () => {
      setMessage('')
      if (!socket || !isConnected) {
        queryClient.invalidateQueries({ queryKey: ['chatRoom', matchId] })
      }
    }
  })

  // Optimized scroll to bottom with debouncing
  const scrollToBottom = useCallback(
    debounce(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100),
    []
  )

  // Memoized formatted messages
  const formattedMessages = useMemo(() => {
    if (!chatRoom?.messages) return []
    // Reverse the messages since API returns newest first, but UI needs oldest first
    return chatRoom.messages.slice().reverse().map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderImage: msg.sender.image,
      chatRoomId: chatRoom.id,
      messageType: msg.messageType,
      createdAt: new Date(msg.createdAt),
      isRead: false
    }))
  }, [chatRoom?.messages, chatRoom?.id])

  // Initialize messages when chat room is loaded
  useEffect(() => {
    setMessages(formattedMessages)
    if (formattedMessages.length > 0) {
      scrollToBottom()
    }
  }, [formattedMessages, scrollToBottom])

  // Optimized typing indicator with debouncing
  const debouncedTypingStart = useCallback(
    debounce((chatRoomId: string) => {
      if (socket && isConnected) {
        socket.emit('typing:start', chatRoomId)
        setIsTyping(true)
      }
    }, 300),
    [socket, isConnected]
  )

  const debouncedTypingStop = useCallback(
    debounce((chatRoomId: string) => {
      if (socket && isConnected) {
        socket.emit('typing:stop', chatRoomId)
        setIsTyping(false)
      }
    }, 1000),
    [socket, isConnected]
  )

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected || !chatRoom?.id) return

    socket.emit('room:join', chatRoom.id)

    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate messages
        const existingMessage = prev.find(m => m.id === message.id)
        if (existingMessage) {
          return prev
        }
        return [...prev, message]
      })
      scrollToBottom()
      // Invalidate the chat room query to refresh from database
      queryClient.invalidateQueries({ queryKey: ['chatRoom', matchId] })
    }

    const handleUserTyping = (userId: string, userName: string) => {
      if (userId !== session?.user?.id) {
        setTypingUsers(prev => new Set([...Array.from(prev), userName || 'Someone']))
      }
    }

    const handleUserStopTyping = (userId: string) => {
      if (userId !== session?.user?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          // Find and remove the user (we only have userId, so remove any matching entries)
          // This is simplified - in a real app you'd want to track userId to userName mapping
          const user = chatRoom.match.players.find(p => p.player.id === userId)?.player.name ||
                       (chatRoom.match.creator.id === userId ? chatRoom.match.creator.name : 'Someone')
          newSet.delete(user || 'Someone')
          return newSet
        })
      }
    }

    socket.on('message:new', handleNewMessage)
    socket.on('user:typing', handleUserTyping)
    socket.on('user:stop-typing', handleUserStopTyping)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('user:typing', handleUserTyping)
      socket.off('user:stop-typing', handleUserStopTyping)
      socket.emit('room:leave', chatRoom.id)
    }
  }, [socket, isConnected, chatRoom?.id, session?.user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendMessageMutation.isPending) return
    
    sendMessageMutation.mutate(message)
    handleStopTyping()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    handleTyping()
  }

  const handleTyping = () => {
    if (!socket || !isConnected || !chatRoom?.id) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing:start', chatRoom.id)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping && socket && isConnected && chatRoom?.id) {
      setIsTyping(false)
      socket.emit('typing:stop', chatRoom.id)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const getParticipants = () => {
    if (!chatRoom) return []
    const participants = [chatRoom.match.creator, ...chatRoom.match.players.map(p => p.player)]
    return participants.filter((participant, index, self) => 
      index === self.findIndex(p => p.id === participant.id)
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-green-600" />
        <span className="ml-2">Loading chat...</span>
      </div>
    )
  }

  if (error) {
    // Show demo chat when database is not ready
    return <ChatDemo matchId={matchId} matchTitle={matchTitle || 'Golf Round'} />
  }

  if (!chatRoom) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FontAwesomeIcon icon={faComments} className="h-12 w-12 mb-4 text-gray-300" />
        <p>Chat room not available</p>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-full bg-white shadow-lg border-green-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center mb-2 truncate">
              <FontAwesomeIcon icon={faComments} className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="truncate">{chatRoom.match.title}</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
                <span className="font-medium text-green-700 truncate">{chatRoom.match.course}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-sm text-gray-600 ml-4 flex-shrink-0">
            <div className="flex items-center mb-1">
              <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-1" />
              <span className="font-medium">{getParticipants().length} players</span>
            </div>
            {!isConnected && (
              <span className="text-red-500 text-xs flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                Offline
              </span>
            )}
            {isConnected && (
              <span className="text-green-500 text-xs flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Online
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div 
          className="flex-1 chat-scroll-container p-4 space-y-4 min-h-0"
          style={{ maxHeight: '400px', minHeight: '200px' }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg break-words ${
                  msg.senderId === session?.user?.id
                    ? 'bg-green-600 text-white'
                    : msg.messageType === 'system'
                    ? 'bg-gray-100 text-gray-700 italic'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.senderId !== session?.user?.id && msg.messageType !== 'system' && (
                  <div className="text-xs font-semibold mb-1 text-green-600">
                    {msg.senderName || 'Unknown User'}
                  </div>
                )}
                <div className="text-sm break-words">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.senderId === session?.user?.id 
                    ? 'text-green-100' 
                    : 'text-gray-500'
                }`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))}
          {typingUsers.size > 0 && (
            <div className="flex justify-start w-full">
              <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm italic max-w-[70%]">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-green-100 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending || !isConnected}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!message.trim() || sendMessageMutation.isPending || !isConnected}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendMessageMutation.isPending ? (
                <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}