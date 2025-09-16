import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatRoomId = searchParams.get('chatRoomId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    if (!chatRoomId) {
      return NextResponse.json({ error: 'Chat room ID is required' }, { status: 400 })
    }

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: chatRoomId,
        match: {
          OR: [
            { creatorId: session.user.id },
            { players: { some: { playerId: session.user.id, status: 'accepted' } } }
          ]
        }
      }
    })

    if (!chatRoom) {
      return NextResponse.json({ error: 'Access denied to this chat room' }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to get chronological order
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatRoomId, content, messageType = 'text' } = await request.json()

    if (!chatRoomId || !content) {
      return NextResponse.json({ error: 'Chat room ID and content are required' }, { status: 400 })
    }

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: chatRoomId,
        match: {
          OR: [
            { creatorId: session.user.id },
            { players: { some: { playerId: session.user.id, status: 'accepted' } } }
          ]
        }
      }
    })

    if (!chatRoom) {
      return NextResponse.json({ error: 'Access denied to this chat room' }, { status: 403 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        chatRoomId,
        senderId: session.user.id,
        messageType
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

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, isRead } = await request.json()

    if (!messageId || typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'Message ID and read status are required' }, { status: 400 })
    }

    // Update message read status
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead },
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

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}