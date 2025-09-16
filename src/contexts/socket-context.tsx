'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket'

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !socket) {
      console.log('Initializing socket connection...')
      
      // Initialize socket connection directly (no need for API call with custom server)
      const newSocket = io({
        path: '/api/socketio',
        auth: {
          session: session
        }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      setSocket(newSocket)
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket connection')
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [session, status])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}