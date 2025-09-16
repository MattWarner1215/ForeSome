const { prisma } = require('./prisma')

class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data) {
    try {
      const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null

      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          senderId: data.senderId,
          matchId: data.matchId,
          groupId: data.groupId,
          metadata: metadataStr
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          match: {
            select: {
              id: true,
              title: true,
              course: true,
              date: true,
              time: true
            }
          }
        }
      })

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  /**
   * Create chat message notification for offline users
   */
  static async createChatMessageNotification(
    recipientId,
    senderId,
    senderName,
    matchId,
    matchTitle,
    messageContent,
    chatRoomId,
    messageId
  ) {
    // Truncate long messages for notification preview
    const truncatedMessage = messageContent.length > 100 
      ? messageContent.substring(0, 97) + '...' 
      : messageContent
    
    return this.create({
      type: 'chat_message',
      title: 'New Message',
      message: `${senderName}: ${truncatedMessage}`,
      userId: recipientId,
      senderId: senderId,
      matchId: matchId,
      metadata: {
        action: 'chat_message',
        chatRoomId,
        messageId,
        matchTitle,
        senderName,
        originalMessage: messageContent
      }
    })
  }
}

module.exports = { NotificationService }