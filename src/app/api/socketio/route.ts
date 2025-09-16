import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { initializeSocketIO } from '@/lib/socket'

export async function GET(request: NextRequest) {
  const res = request as any
  
  if (!res.socket?.server?.io) {
    console.log('Initializing Socket.IO server...')
    
    const httpServer: NetServer = res.socket.server
    const io: SocketIOServer = initializeSocketIO(httpServer)
    
    res.socket.server.io = io
    
    console.log('Socket.IO server initialized')
  } else {
    console.log('Socket.IO server already running')
  }

  return new Response('Socket.IO server is running', { status: 200 })
}