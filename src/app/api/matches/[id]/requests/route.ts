import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/matches/[id]/requests - Get all pending requests for a match
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

    // Check if user is the match creator
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { creatorId: true }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match.creatorId !== session.user.id) {
      return NextResponse.json({ message: 'Only match creators can view requests' }, { status: 403 })
    }

    // Get all pending requests for this match
    const requests = await prisma.matchPlayer.findMany({
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
        id: 'asc' // First come, first served
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}