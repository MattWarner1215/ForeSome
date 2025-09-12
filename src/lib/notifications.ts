import { prisma } from './prisma'

export interface NotificationData {
  type: 'join_request' | 'join_approved' | 'join_declined' | 'match_update' | 'group_invite'
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
    requesterId: string,
    matchCreatorId: string,
    matchId: string,
    matchTitle: string
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
    requesterId: string,
    matchCreatorId: string,
    matchId: string,
    matchTitle: string,
    reason?: string
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