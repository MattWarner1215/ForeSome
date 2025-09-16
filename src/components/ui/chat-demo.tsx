'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faComments, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useSocket } from '@/contexts/socket-context'
import { formatDistanceToNow } from 'date-fns'

interface ChatDemoProps {
  matchId: string
  matchTitle: string
}

interface DemoMessage {
  id: string
  content: string
  senderId: string
  senderName: string | null
  senderImage: string | null
  messageType: string
  createdAt: Date
  isRead: boolean
}

export function ChatDemo({ matchId, matchTitle }: ChatDemoProps) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize with demo messages
  useEffect(() => {
    const demoMessages: DemoMessage[] = [
      {
        id: '1',
        content: 'Welcome to the chat! This is a demo showing how the real-time chat will work once the database is set up.',
        senderId: 'system',
        senderName: 'System',
        senderImage: null,
        messageType: 'system',
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        isRead: false
      },
      {
        id: '2',
        content: 'Hey everyone! Looking forward to our round tomorrow. What time should we meet?',
        senderId: 'demo-user-1',
        senderName: 'John Smith',
        senderImage: null,
        messageType: 'text',
        createdAt: new Date(Date.now() - 180000), // 3 minutes ago
        isRead: false
      },
      {
        id: '3',
        content: 'How about 8:30 AM? That should give us plenty of time before it gets too busy.',
        senderId: 'demo-user-2',
        senderName: 'Sarah Johnson',
        senderImage: null,
        messageType: 'text',
        createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        isRead: false
      },
      {
        id: '4',
        content: 'Perfect! I\'ll bring some extra golf balls just in case. The course looks challenging!',
        senderId: 'demo-user-1',
        senderName: 'John Smith',
        senderImage: null,
        messageType: 'text',
        createdAt: new Date(Date.now() - 60000), // 1 minute ago
        isRead: false
      }
    ]
    setMessages(demoMessages)
  }, [])

  // Socket event listeners for real-time features (when available)
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (newMessage: any) => {
      const demoMessage: DemoMessage = {
        id: Date.now().toString(),
        content: newMessage.content,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        senderImage: newMessage.senderImage,
        messageType: 'text',
        createdAt: new Date(),
        isRead: false
      }
      setMessages(prev => [...prev, demoMessage])
      scrollToBottom()
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
          // This is simplified for demo
          newSet.clear()
          return newSet
        })
      }
    }

    // These would be real socket events when database is ready
    socket.on('message:new', handleNewMessage)
    socket.on('user:typing', handleUserTyping)
    socket.on('user:stop-typing', handleUserStopTyping)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('user:typing', handleUserTyping)
      socket.off('user:stop-typing', handleUserStopTyping)
    }
  }, [socket, isConnected, session?.user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add message to demo chat immediately
    const newMessage: DemoMessage = {
      id: Date.now().toString(),
      content: message,
      senderId: session?.user?.id || 'current-user',
      senderName: session?.user?.name || null,
      senderImage: session?.user?.image || null,
      messageType: 'text',
      createdAt: new Date(),
      isRead: false
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
    handleStopTyping()
    scrollToBottom()

    // In real implementation, this would send via socket or API
    if (socket && isConnected) {
      socket.emit('message:send', { content: message, chatRoomId: matchId })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    handleTyping()
  }

  const handleTyping = () => {
    if (!socket || !isConnected) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing:start', matchId)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping && socket && isConnected) {
      setIsTyping(false)
      socket.emit('typing:stop', matchId)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <Card className="flex flex-col h-[600px] bg-white shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
            <FontAwesomeIcon icon={faComments} className="h-5 w-5 mr-2" />
            Chat Demo - {matchTitle}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-1" />
            4 {/* Demo participant count */}
            <span className="ml-2 text-blue-500 text-xs">
              • Demo Mode
            </span>
          </div>
        </div>
        <div className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
          🚀 <strong>Demo Chat:</strong> This shows how the real-time chat will work. Messages you send will appear here instantly, and in production, other players would see them in real-time too!
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === session?.user?.id || msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === session?.user?.id || msg.senderId === 'current-user'
                      ? 'bg-blue-600 text-white'
                      : msg.messageType === 'system'
                      ? 'bg-gray-100 text-gray-700 italic'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {(msg.senderId !== session?.user?.id && msg.senderId !== 'current-user') && msg.messageType !== 'system' && (
                    <div className="text-xs font-semibold mb-1 text-blue-600">
                      {msg.senderName || 'Unknown User'}
                    </div>
                  )}
                  <div className="text-sm">{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.senderId === session?.user?.id || msg.senderId === 'current-user'
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm italic">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-blue-100 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message... (Demo mode - try it!)"
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>💡 Try sending a message to see how the chat works!</span>
            <span className={`px-2 py-1 rounded text-xs ${isConnected ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              Socket: {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}