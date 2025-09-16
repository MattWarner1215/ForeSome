import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string | null
  senderImage: string | null
  chatRoomId: string
  messageType: string
  createdAt: Date
  isRead: boolean
}

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void
  'message:read': (messageId: string, userId: string) => void
  'user:typing': (userId: string, userName: string) => void
  'user:stop-typing': (userId: string) => void
  'room:joined': (userId: string, userName: string) => void
  'room:left': (userId: string, userName: string) => void
}

export interface ClientToServerEvents {
  'message:send': (data: { content: string; chatRoomId: string }) => void
  'message:read': (messageId: string) => void
  'room:join': (chatRoomId: string) => void
  'room:leave': (chatRoomId: string) => void
  'typing:start': (chatRoomId: string) => void
  'typing:stop': (chatRoomId: string) => void
}

export interface SocketData {
  userId: string
  userName: string | null
  userImage: string | null
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export const initializeSocketIO = (server: NetServer) => {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const session = socket.handshake.auth?.session
      if (!session?.user?.id) {
        return next(new Error('Authentication required'))
      }
      
      socket.data = {
        userId: session.user.id,
        userName: session.user.name,
        userImage: session.user.image
      }
      
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.data.userId)

    socket.on('room:join', async (chatRoomId: string) => {
      try {
        // Verify user has access to this chat room
        const chatRoom = await prisma.chatRoom.findFirst({
          where: {
            id: chatRoomId,
            match: {
              OR: [
                { creatorId: socket.data.userId },
                { players: { some: { playerId: socket.data.userId, status: 'accepted' } } }
              ]
            }
          },
          include: {
            match: {
              include: {
                creator: true,
                players: {
                  include: { player: true },
                  where: { status: 'accepted' }
                }
              }
            }
          }
        })

        if (!chatRoom) {
          console.log('Access denied to chat room')
          return
        }

        socket.join(chatRoomId)
        socket.to(chatRoomId).emit('room:joined', socket.data.userId, socket.data.userName || 'Unknown User')
        console.log(`User ${socket.data.userId} joined chat room ${chatRoomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
        console.log('Failed to join chat room')
      }
    })

    socket.on('room:leave', (chatRoomId: string) => {
      socket.leave(chatRoomId)
      socket.to(chatRoomId).emit('room:left', socket.data.userId, socket.data.userName || 'Unknown User')
      console.log(`User ${socket.data.userId} left chat room ${chatRoomId}`)
    })

    socket.on('message:send', async (data: { content: string; chatRoomId: string }) => {
      try {
        const { content, chatRoomId } = data

        // Verify user has access to this chat room
        const chatRoom = await prisma.chatRoom.findFirst({
          where: {
            id: chatRoomId,
            match: {
              OR: [
                { creatorId: socket.data.userId },
                { players: { some: { playerId: socket.data.userId, status: 'accepted' } } }
              ]
            }
          }
        })

        if (!chatRoom) {
          console.log('Access denied to chat room')
          return
        }

        // Save message to database
        const message = await prisma.chatMessage.create({
          data: {
            content,
            chatRoomId,
            senderId: socket.data.userId,
            messageType: 'text'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        })

        const chatMessage: ChatMessage = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: message.sender.name,
          senderImage: message.sender.image,
          chatRoomId: message.chatRoomId,
          messageType: message.messageType,
          createdAt: message.createdAt,
          isRead: message.isRead
        }

        // Broadcast message to all users in the chat room
        io.to(chatRoomId).emit('message:new', chatMessage)
        console.log(`Message sent in room ${chatRoomId} by user ${socket.data.userId}`)
      } catch (error) {
        console.error('Error sending message:', error)
        console.log('Failed to send message')
      }
    })

    socket.on('message:read', async (messageId: string) => {
      try {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { isRead: true }
        })

        // Notify other users that the message was read
        const message = await prisma.chatMessage.findUnique({
          where: { id: messageId },
          select: { chatRoomId: true }
        })

        if (message) {
          socket.to(message.chatRoomId).emit('message:read', messageId, socket.data.userId)
        }
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    })

    socket.on('typing:start', (chatRoomId: string) => {
      socket.to(chatRoomId).emit('user:typing', socket.data.userId, socket.data.userName || 'Unknown User')
    })

    socket.on('typing:stop', (chatRoomId: string) => {
      socket.to(chatRoomId).emit('user:stop-typing', socket.data.userId)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.data.userId)
    })
  })

  return io
}