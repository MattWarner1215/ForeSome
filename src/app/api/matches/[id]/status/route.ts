import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/matches/[id]/status - Update match status (complete/cancel)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    
    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status. Must be "completed" or "cancelled"' }, { status: 400 })
    }

    const matchId = (await params).id

    // Check if user is the match creator
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        players: {
          where: { status: 'accepted' },
          include: {
            player: {
              select: { id: true, name: true, email: true, handicap: true }
            }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match.creatorId !== session.user.id) {
      return NextResponse.json({ message: 'Only match creators can update match status' }, { status: 403 })
    }

    if (match.status !== 'scheduled') {
      return NextResponse.json({ message: 'Match has already been completed or cancelled' }, { status: 400 })
    }

    // Update match status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        players: {
          where: { status: 'accepted' },
          include: {
            player: {
              select: { id: true, name: true, email: true, handicap: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: `Match marked as ${status}`,
      match: updatedMatch
    })
  } catch (error) {
    console.error('Update match status error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}