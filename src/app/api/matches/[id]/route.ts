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

// PUT /api/matches/[id] - Update match details (creator only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const matchId = (await params).id
    const body = await request.json()

    const { title, description, course, address, date, time, maxPlayers } = body

    // Validate required fields
    if (!title || !course || !address || !date || !time || !maxPlayers) {
      return NextResponse.json({
        message: 'Missing required fields: title, course, address, date, time, maxPlayers'
      }, { status: 400 })
    }

    // Validate maxPlayers is a number >= 2
    if (typeof maxPlayers !== 'number' || maxPlayers < 2) {
      return NextResponse.json({
        message: 'Max players must be a number >= 2'
      }, { status: 400 })
    }

    // Check if match exists and user is creator
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        _count: {
          select: {
            players: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!existingMatch) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    if (existingMatch.creatorId !== session.user.id) {
      return NextResponse.json({
        message: 'Only the match creator can edit the match'
      }, { status: 403 })
    }

    // Check if match is not completed
    if (existingMatch.status === 'completed') {
      return NextResponse.json({
        message: 'Cannot edit completed matches'
      }, { status: 400 })
    }

    // Validate that new maxPlayers is not less than current player count
    const currentPlayerCount = existingMatch._count.players + 1 // +1 for creator
    if (maxPlayers < currentPlayerCount) {
      return NextResponse.json({
        message: `Cannot reduce max players to ${maxPlayers}. Current player count is ${currentPlayerCount}`
      }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        message: 'Date must be in YYYY-MM-DD format'
      }, { status: 400 })
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(time)) {
      return NextResponse.json({
        message: 'Time must be in HH:MM format'
      }, { status: 400 })
    }

    // Convert date string to DateTime (Prisma expects DateTime for date field)
    const dateTime = new Date(`${date}T${time}:00.000Z`)
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json({
        message: 'Invalid date or time provided'
      }, { status: 400 })
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        course: course.trim(),
        address: address.trim(),
        date: dateTime,
        time,
        maxPlayers
      },
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

    return NextResponse.json({
      message: 'Match updated successfully',
      match: updatedMatch
    })
  } catch (error) {
    console.error('Update match error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}