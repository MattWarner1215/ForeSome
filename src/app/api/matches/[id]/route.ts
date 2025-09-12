import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/matches/[id] - Get match details with requests if creator
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const matchId = (await params).id

    // Get match with all details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            handicap: true
          }
        },
        players: {
          where: {
            status: 'accepted'
          },
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
                handicap: true
              }
            }
          }
        },
        _count: {
          select: {
            players: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    // If user is the creator, include pending requests
    let pendingRequests: any[] = []
    if (match.creatorId === session.user.id) {
      pendingRequests = await prisma.matchPlayer.findMany({
        where: {
          matchId,
          status: 'pending'
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
              handicap: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      })
    }

    // Check user's relationship to this match
    let userStatus = null
    const userRequest = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId: session.user.id
        }
      }
    })

    if (userRequest) {
      userStatus = userRequest.status
    }

    return NextResponse.json({
      ...match,
      pendingRequests: match.creatorId === session.user.id ? pendingRequests : undefined,
      userStatus,
      isCreator: match.creatorId === session.user.id
    })
  } catch (error) {
    console.error('Get match error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}