import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications'

// PUT /api/matches/[id]/requests/[requestId] - Accept or decline a request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json() // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Must be "accept" or "decline"' }, { status: 400 })
    }

    const matchId = (await params).id
    const requestId = (await params).requestId

    // Check if user is the match creator
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          where: { status: 'accepted' }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match.creatorId !== session.user.id) {
      return NextResponse.json({ message: 'Only match creators can manage requests' }, { status: 403 })
    }

    // Check if the request exists and is pending
    const matchRequest = await prisma.matchPlayer.findUnique({
      where: { id: requestId },
      include: {
        player: {
          select: { name: true, email: true }
        }
      }
    })

    if (!matchRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }

    if (matchRequest.matchId !== matchId) {
      return NextResponse.json({ message: 'Request does not belong to this match' }, { status: 400 })
    }

    if (matchRequest.status !== 'pending') {
      return NextResponse.json({ message: 'Request has already been processed' }, { status: 400 })
    }

    if (action === 'accept') {
      // Check if match would be full after accepting
      if ((match.players.length + 1) >= match.maxPlayers) {
        return NextResponse.json({ message: 'Match is full' }, { status: 400 })
      }

      // Accept the request
      const acceptedPlayer = await prisma.matchPlayer.update({
        where: { id: requestId },
        data: { status: 'accepted' }
      })

      // Create notification for the accepted player
      try {
        await NotificationService.createJoinApprovedNotification(
          matchRequest.playerId,
          session.user.id,
          matchId,
          match.title
        )
      } catch (error) {
        console.error('Failed to create join approved notification:', error)
      }

      console.log('Request accepted:', { 
        matchId, 
        requestId, 
        playerId: matchRequest.playerId,
        playerName: matchRequest.player.name || matchRequest.player.email
      })

      return NextResponse.json({ 
        message: `Request accepted. ${matchRequest.player.name || matchRequest.player.email} has been added to the match.`,
        success: true
      })
    } else {
      // Create notification for the declined player before deleting the request
      try {
        await NotificationService.createJoinDeclinedNotification(
          matchRequest.playerId,
          session.user.id,
          matchId,
          match.title
        )
      } catch (error) {
        console.error('Failed to create join declined notification:', error)
      }

      // Decline the request by deleting it (cleaner than marking as declined)
      await prisma.matchPlayer.delete({
        where: { id: requestId }
      })

      console.log('Request declined:', { 
        matchId, 
        requestId, 
        playerId: matchRequest.playerId,
        playerName: matchRequest.player.name || matchRequest.player.email
      })

      return NextResponse.json({ 
        message: `Request declined and removed.`,
        success: true
      })
    }

  } catch (error) {
    console.error('Manage request error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}