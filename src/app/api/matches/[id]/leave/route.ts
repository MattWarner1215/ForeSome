import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const matchId = (await params).id

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    // Check if user is the creator (creators cannot leave their own match)
    if (match.creatorId === session.user.id) {
      return NextResponse.json({ message: 'Cannot leave your own match' }, { status: 400 })
    }

    // Find the player record
    const playerRecord = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId: session.user.id
        }
      }
    })

    if (!playerRecord) {
      return NextResponse.json({ message: 'Not a member of this match' }, { status: 400 })
    }

    // Remove user from match
    await prisma.matchPlayer.delete({
      where: {
        matchId_playerId: {
          matchId,
          playerId: session.user.id
        }
      }
    })

    return NextResponse.json({ message: 'Successfully left match' })
  } catch (error) {
    console.error('Leave match error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}