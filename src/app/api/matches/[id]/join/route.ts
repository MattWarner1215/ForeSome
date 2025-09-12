import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const matchId = (await params).id

    // Check if match exists and is in the future
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: true,
        _count: {
          select: {
            players: true
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    // Check if match is in the past (allow joining matches on the same day)
    const matchDate = new Date(match.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison
    
    if (matchDate < today) {
      return NextResponse.json({ message: 'Cannot join past matches' }, { status: 400 })
    }

    // Check if match is still scheduled (not completed or cancelled)
    if (match.status !== 'scheduled') {
      return NextResponse.json({ 
        message: `Cannot join ${match.status} matches` 
      }, { status: 400 })
    }

    // Check if user is already in the match
    const existingPlayer = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId: session.user.id
        }
      }
    })

    if (existingPlayer) {
      return NextResponse.json({ message: 'Already joined this match' }, { status: 400 })
    }

    // Check if user is the creator
    if (match.creatorId === session.user.id) {
      return NextResponse.json({ message: 'Cannot join your own match' }, { status: 400 })
    }

    // Check if match is full (count only accepted players)
    const acceptedPlayersCount = match.players.filter(p => p.status === 'accepted').length
    if ((acceptedPlayersCount + 1) >= match.maxPlayers) {
      return NextResponse.json({ message: 'Match is full' }, { status: 400 })
    }

    // All rounds now require creator approval
    const status = 'pending'
    
    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    })

    // Add user to match
    const newPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId: session.user.id,
        status
      }
    })

    // Create notification for match creator
    try {
      await NotificationService.createJoinRequestNotification(
        match.creatorId,
        session.user.id,
        matchId,
        match.title,
        user?.name || user?.email || 'Unknown User'
      )
    } catch (error) {
      console.error('Failed to create join request notification:', error)
      // Don't fail the entire request if notification fails
    }

    console.log('User joined match:', { 
      matchId, 
      userId: session.user.id, 
      status, 
      playerId: newPlayer.id 
    })

    const message = 'Request sent successfully. Waiting for match creator approval.'
    
    return NextResponse.json({ 
      message, 
      status,
      success: true 
    })
  } catch (error) {
    console.error('Join match error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}