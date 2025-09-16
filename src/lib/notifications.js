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
   * Create join request notification
   */
  static async createJoinRequestNotification(
    matchCreatorId,
    requesterId,
    matchId,
    matchTitle,
    requesterName
  ) {
    return this.create({
      type: 'join_request',
      title: 'New Join Request',
      message: `${requesterName} wants to join your round "${matchTitle}"`,
      userId: matchCreatorId,
      senderId: requesterId,
      matchId: matchId,
      metadata: {
        action: 'join_request',
        matchTitle,
        requesterName
      }
    })
  }

  /**
   * Create join approval notification
   */
  static async createJoinApprovedNotification(
    requesterId,
    matchCreatorId,
    matchId,
    matchTitle
  ) {
    return this.create({
      type: 'join_approved',
      title: 'Join Request Approved',
      message: `Your request to join "${matchTitle}" has been approved!`,
      userId: requesterId,
      senderId: matchCreatorId,
      matchId: matchId,
      metadata: {
        action: 'join_approved',
        matchTitle
      }
    })
  }

  /**
   * Create join declined notification
   */
  static async createJoinDeclinedNotification(
    requesterId,
    matchCreatorId,
    matchId,
    matchTitle,
    reason
  ) {
    return this.create({
      type: 'join_declined',
      title: 'Join Request Declined',
      message: `Your request to join "${matchTitle}" was declined${reason ? `: ${reason}` : ''}`,
      userId: requesterId,
      senderId: matchCreatorId,
      matchId: matchId,
      metadata: {
        action: 'join_declined',
        matchTitle,
        reason
      }
    })
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