import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { creatorId: session.user.id },
          { players: { some: { playerId: session.user.id, status: 'accepted' } } }
        ]
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Access denied to this match' }, { status: 403 })
    }

    // Check if chat room already exists
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { matchId },
      include: {
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        match: {
          select: {
            id: true,
            title: true,
            course: true,
            date: true,
            time: true,
            creator: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            players: {
              where: { status: 'accepted' },
              select: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Create chat room if it doesn't exist
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          matchId,
          isActive: true
        },
        include: {
          messages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          match: {
            select: {
              id: true,
              title: true,
              course: true,
              date: true,
              time: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              },
              players: {
                where: { status: 'accepted' },
                select: {
                  player: {
                    select: {
                      id: true,
                      name: true,
                      image: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Send welcome message
      await prisma.chatMessage.create({
        data: {
          content: `Welcome to the chat for "${match.title}"! Feel free to discuss tee times, course conditions, or just chat about golf.`,
          chatRoomId: chatRoom.id,
          senderId: session.user.id,
          messageType: 'system'
        }
      })
    }

    return NextResponse.json(chatRoom)
  } catch (error) {
    console.error('Error managing chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { creatorId: session.user.id },
          { players: { some: { playerId: session.user.id, status: 'accepted' } } }
        ]
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Access denied to this match' }, { status: 403 })
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { matchId },
      include: {
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        match: {
          select: {
            id: true,
            title: true,
            course: true,
            date: true,
            time: true,
            creator: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            players: {
              where: { status: 'accepted' },
              select: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // No caching for real-time chat data
    const response = NextResponse.json(chatRoom)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}