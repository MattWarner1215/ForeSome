const { prisma } = require('./prisma')
const { NotificationService } = require('./notifications.js')

function initializeSocketIO(io) {
  const authenticatedUsers = new Map()
  const onlineUsers = new Set() // Track online user IDs
  const userSocketMap = new Map() // Map user IDs to socket IDs
  const roomPermissionsCache = new Map()
  const messageBuffer = new Map()
  
  // Rate limiting per user
  const rateLimiter = new Map()
  const RATE_LIMIT = 10 // messages per minute
  const RATE_WINDOW = 60000 // 1 minute

  // Cache room permissions for 5 minutes
  function getCachedRoomPermission(userId, chatRoomId) {
    const key = `${userId}:${chatRoomId}`
    const cached = roomPermissionsCache.get(key)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.hasAccess
    }
    return null
  }

  function setCachedRoomPermission(userId, chatRoomId, hasAccess) {
    const key = `${userId}:${chatRoomId}`
    roomPermissionsCache.set(key, { hasAccess, timestamp: Date.now() })
  }

  // Rate limiting check
  function checkRateLimit(userId) {
    const now = Date.now()
    const userLimits = rateLimiter.get(userId) || { count: 0, resetTime: now + RATE_WINDOW }
    
    if (now > userLimits.resetTime) {
      userLimits.count = 1
      userLimits.resetTime = now + RATE_WINDOW
    } else {
      userLimits.count++
    }
    
    rateLimiter.set(userId, userLimits)
    return userLimits.count <= RATE_LIMIT
  }

  // Batch message processing
  function processBatchedMessages() {
    for (const [chatRoomId, messages] of messageBuffer.entries()) {
      if (messages.length > 0) {
        io.to(chatRoomId).emit('messages:batch', messages)
        messageBuffer.set(chatRoomId, [])
      }
    }
  }

  // Process batched messages every 100ms for optimal performance
  setInterval(processBatchedMessages, 100)

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
      
      authenticatedUsers.set(socket.id, socket.data)
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.data.userId)
    
    // Track user as online
    onlineUsers.add(socket.data.userId)
    userSocketMap.set(socket.data.userId, socket.id)

    socket.on('room:join', async (chatRoomId) => {
      try {
        // Check cached permissions first
        let hasAccess = getCachedRoomPermission(socket.data.userId, chatRoomId)
        
        if (hasAccess === null) {
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

          hasAccess = !!chatRoom
          setCachedRoomPermission(socket.data.userId, chatRoomId, hasAccess)
        }

        if (!hasAccess) {
          socket.emit('error', 'Access denied to chat room')
          return
        }

        socket.join(chatRoomId)
        socket.to(chatRoomId).emit('room:joined', socket.data.userId, socket.data.userName || 'Unknown User')
        console.log(`User ${socket.data.userId} joined chat room ${chatRoomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('error', 'Failed to join chat room')
      }
    })

    socket.on('room:leave', (chatRoomId) => {
      socket.leave(chatRoomId)
      socket.to(chatRoomId).emit('room:left', socket.data.userId, socket.data.userName || 'Unknown User')
      console.log(`User ${socket.data.userId} left chat room ${chatRoomId}`)
    })

    socket.on('message:send', async (data) => {
      try {
        const { content, chatRoomId } = data

        // Rate limiting check
        if (!checkRateLimit(socket.data.userId)) {
          socket.emit('error', 'Rate limit exceeded. Please slow down.')
          return
        }

        // Validate message content
        if (!content || content.trim().length === 0 || content.length > 1000) {
          socket.emit('error', 'Invalid message content')
          return
        }

        // Check cached permissions first
        let hasAccess = getCachedRoomPermission(socket.data.userId, chatRoomId)
        
        if (hasAccess === null) {
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

          hasAccess = !!chatRoom
          setCachedRoomPermission(socket.data.userId, chatRoomId, hasAccess)
        }

        if (!hasAccess) {
          socket.emit('error', 'Access denied to chat room')
          return
        }

        // Save message to database
        const message = await prisma.chatMessage.create({
          data: {
            content: content.trim(),
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

        const chatMessage = {
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

        // Broadcast message to all users in the chat room immediately for real-time feel
        io.to(chatRoomId).emit('message:new', chatMessage)
        console.log(`Message sent in room ${chatRoomId} by user ${socket.data.userId}`)

        // Get chat room participants to check for offline users
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: chatRoomId },
          include: {
            match: {
              include: {
                creator: { select: { id: true, name: true } },
                players: {
                  where: { status: 'accepted' },
                  include: { player: { select: { id: true, name: true } } }
                }
              }
            }
          }
        })

        if (chatRoom) {
          // Get all participants (creator + accepted players)
          const participants = [
            chatRoom.match.creator,
            ...chatRoom.match.players.map(p => p.player)
          ]

          console.log(`Chat participants: ${participants.map(p => p.id).join(', ')}`)
          console.log(`Online users: ${Array.from(onlineUsers).join(', ')}`)
          console.log(`Sender: ${socket.data.userId}`)

          // Create notifications for offline participants (excluding sender)
          for (const participant of participants) {
            console.log(`Checking participant ${participant.id}: isOnline=${onlineUsers.has(participant.id)}, isSender=${participant.id === socket.data.userId}`)
            if (participant.id !== socket.data.userId && !onlineUsers.has(participant.id)) {
              try {
                console.log(`Creating notification for offline user: ${participant.id}`)
                await NotificationService.createChatMessageNotification(
                  participant.id,
                  socket.data.userId,
                  socket.data.userName || 'Unknown User',
                  chatRoom.match.id,
                  chatRoom.match.title || 'Golf Round',
                  content.trim(),
                  chatRoomId,
                  message.id
                )
                console.log(`Created chat notification for offline user: ${participant.id}`)
              } catch (notificationError) {
                console.error('Failed to create chat notification:', notificationError)
              }
            } else {
              console.log(`Skipping notification for ${participant.id}: ${participant.id === socket.data.userId ? 'is sender' : 'is online'}`)
            }
          }
        } else {
          console.log('Chat room not found or no access')
        }
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    socket.on('message:read', async (messageId) => {
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

    socket.on('typing:start', (chatRoomId) => {
      socket.to(chatRoomId).emit('user:typing', socket.data.userId, socket.data.userName || 'Unknown User')
    })

    socket.on('typing:stop', (chatRoomId) => {
      socket.to(chatRoomId).emit('user:stop-typing', socket.data.userId)
    })

    socket.on('disconnect', () => {
      authenticatedUsers.delete(socket.id)
      
      // Remove user from online tracking
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId)
        userSocketMap.delete(socket.data.userId)
      }
      
      console.log('User disconnected:', socket.data.userId)
    })
  })

  return io
}

module.exports = { initializeSocketIO }