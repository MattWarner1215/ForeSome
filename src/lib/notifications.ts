import { prisma } from './prisma'
import { EmailService } from './email'

export interface NotificationData {
  type: 'join_request' | 'join_approved' | 'join_declined' | 'match_update' | 'group_invite' | 'chat_message'
  title: string
  message: string
  userId: string
  senderId?: string
  matchId?: string
  groupId?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data: NotificationData) {
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
    matchCreatorId: string,
    requesterId: string,
    matchId: string,
    matchTitle: string,
    requesterName: string
  ) {
    const notification = await this.create({
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

    // Send email notification if user has it enabled
    try {
      const creator = await prisma.user.findUnique({
        where: { id: matchCreatorId },
        select: {
          email: true,
          name: true,
          emailNotifications: true,
          emailJoinRequests: true
        }
      })

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { date: true, time: true }
      })

      if (creator?.emailNotifications && creator?.emailJoinRequests && match) {
        await EmailService.sendJoinRequestEmail(
          creator.email,
          creator.name || 'Golfer',
          requesterName,
          matchTitle,
          new Date(match.date).toLocaleDateString(),
          match.time,
          matchId
        )
      }
    } catch (error) {
      console.error('Failed to send join request email:', error)
      // Don't fail the notification creation if email fails
    }

    return notification
  }

  /**
   * Create join approval notification
   */
  static async createJoinApprovedNotification(
    requesterId: string,
    matchCreatorId: string,
    matchId: string,
    matchTitle: string
  ) {
    const notification = await this.create({
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

    // Send email notification if user has it enabled
    try {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: {
          email: true,
          name: true,
          emailNotifications: true,
          emailJoinApprovals: true
        }
      })

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { date: true, time: true, course: true }
      })

      if (requester?.emailNotifications && requester?.emailJoinApprovals && match) {
        await EmailService.sendJoinApprovedEmail(
          requester.email,
          requester.name || 'Golfer',
          matchTitle,
          new Date(match.date).toLocaleDateString(),
          match.time,
          match.course,
          matchId
        )
      }
    } catch (error) {
      console.error('Failed to send join approval email:', error)
    }

    return notification
  }

  /**
   * Create join declined notification
   */
  static async createJoinDeclinedNotification(
    requesterId: string,
    matchCreatorId: string,
    matchId: string,
    matchTitle: string,
    reason?: string
  ) {
    const notification = await this.create({
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

    // Send email notification if user has it enabled
    try {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: {
          email: true,
          name: true,
          emailNotifications: true,
          emailJoinApprovals: true
        }
      })

      if (requester?.emailNotifications && requester?.emailJoinApprovals) {
        await EmailService.sendJoinDeclinedEmail(
          requester.email,
          requester.name || 'Golfer',
          matchTitle,
          reason
        )
      }
    } catch (error) {
      console.error('Failed to send join declined email:', error)
    }

    return notification
  }

  /**
   * Create match update notification
   */
  static async createMatchUpdateNotification(
    participantIds: string[],
    matchCreatorId: string,
    matchId: string,
    matchTitle: string,
    updateType: string,
    message: string
  ) {
    // Create notification for each participant (excluding the creator)
    const notifications = await Promise.all(
      participantIds
        .filter(id => id !== matchCreatorId)
        .map(participantId =>
          this.create({
            type: 'match_update',
            title: 'Match Updated',
            message: `"${matchTitle}" has been updated: ${message}`,
            userId: participantId,
            senderId: matchCreatorId,
            matchId: matchId,
            metadata: {
              action: 'match_update',
              updateType,
              matchTitle
            }
          })
        )
    )

    return notifications
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(notificationIds: string[], userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })
  }

  /**
   * Create chat message notification for offline users
   */
  static async createChatMessageNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    matchId: string,
    matchTitle: string,
    messageContent: string,
    chatRoomId: string,
    messageId: string
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

  /**
   * Clean up old read notifications (older than 30 days)
   */
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })
  }
}