import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/matches/[id]/ratings - Submit ratings for players in a completed match
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { ratings } = await request.json() // Array of { playerId, value, comment }
    
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json({ message: 'Ratings array is required' }, { status: 400 })
    }

    const matchId = (await params).id

    // Check if match exists and is completed
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          where: { status: 'accepted' },
          select: { playerId: true }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'completed') {
      return NextResponse.json({ message: 'Can only rate players in completed matches' }, { status: 400 })
    }

    // Check if user participated in the match (creator or accepted player)
    const isCreator = match.creatorId === session.user.id
    const isPlayer = match.players.some(p => p.playerId === session.user.id)
    
    if (!isCreator && !isPlayer) {
      return NextResponse.json({ message: 'You can only rate players from matches you participated in' }, { status: 403 })
    }

    // Validate all ratings
    for (const rating of ratings) {
      if (!rating.playerId || !rating.value || rating.value < 1 || rating.value > 5) {
        return NextResponse.json({ message: 'Each rating must have a valid playerId and value (1-5)' }, { status: 400 })
      }
      
      if (rating.playerId === session.user.id) {
        return NextResponse.json({ message: 'Cannot rate yourself' }, { status: 400 })
      }

      // Check if the rated player was actually in the match
      const wasInMatch = rating.playerId === match.creatorId || 
                        match.players.some(p => p.playerId === rating.playerId)
      
      if (!wasInMatch) {
        return NextResponse.json({ message: 'Can only rate players who participated in the match' }, { status: 400 })
      }
    }

    // Create or update ratings
    const createdRatings = []
    
    for (const rating of ratings) {
      const existingRating = await prisma.rating.findUnique({
        where: {
          ratedById_ratedUserId_matchId: {
            ratedById: session.user.id,
            ratedUserId: rating.playerId,
            matchId: matchId
          }
        }
      })

      if (existingRating) {
        // Update existing rating
        const updatedRating = await prisma.rating.update({
          where: { id: existingRating.id },
          data: {
            value: rating.value,
            comment: rating.comment || null
          },
          include: {
            ratedUser: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        createdRatings.push(updatedRating)
      } else {
        // Create new rating
        const newRating = await prisma.rating.create({
          data: {
            value: rating.value,
            comment: rating.comment || null,
            matchId: matchId,
            ratedById: session.user.id,
            ratedUserId: rating.playerId
          },
          include: {
            ratedUser: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        createdRatings.push(newRating)
      }
    }

    return NextResponse.json({
      message: 'Ratings submitted successfully',
      ratings: createdRatings
    })
  } catch (error) {
    console.error('Submit ratings error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/matches/[id]/ratings - Get ratings for a match (for the current user)
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

    // Get ratings given by the current user for this match
    const ratings = await prisma.rating.findMany({
      where: {
        matchId: matchId,
        ratedById: session.user.id
      },
      include: {
        ratedUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Get match ratings error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}