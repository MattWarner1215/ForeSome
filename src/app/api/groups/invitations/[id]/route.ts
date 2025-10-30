import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Accept or decline invitation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    // Fetch the invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: params.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            creatorId: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify the user is the invitee
    if (invitation.inviteeId !== session.user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to respond to this invitation' },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { message: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Use a transaction to update invitation and create member
      const result = await prisma.$transaction(async (tx) => {
        // Update invitation status
        const updatedInvitation = await tx.groupInvitation.update({
          where: { id: params.id },
          data: { status: 'accepted' }
        })

        // Add user as member
        await tx.groupMember.create({
          data: {
            groupId: invitation.groupId,
            userId: session.user.id,
            role: 'member'
          }
        })

        // Notify the inviter
        await tx.notification.create({
          data: {
            type: 'group_invitation_accepted',
            title: 'Invitation Accepted',
            message: `${session.user.name || session.user.email} accepted your invitation to join "${invitation.group.name}"`,
            userId: invitation.inviterId,
            senderId: session.user.id,
            groupId: invitation.groupId
          }
        })

        return updatedInvitation
      })

      return NextResponse.json(result)
    } else {
      // Decline invitation
      const updatedInvitation = await prisma.groupInvitation.update({
        where: { id: params.id },
        data: { status: 'declined' }
      })

      // Notify the inviter
      await prisma.notification.create({
        data: {
          type: 'group_invitation_declined',
          title: 'Invitation Declined',
          message: `${session.user.name || session.user.email} declined your invitation to join "${invitation.group.name}"`,
          userId: invitation.inviterId,
          senderId: session.user.id,
          groupId: invitation.groupId
        }
      })

      return NextResponse.json(updatedInvitation)
    }
  } catch (error) {
    console.error('Error responding to group invitation:', error)
    return NextResponse.json(
      { message: 'Error responding to invitation' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel/revoke invitation (for inviters)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: params.id },
      include: {
        group: {
          select: {
            creatorId: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify the user is the inviter or group creator
    const isInviter = invitation.inviterId === session.user.id
    const isGroupCreator = invitation.group.creatorId === session.user.id

    if (!isInviter && !isGroupCreator) {
      return NextResponse.json(
        { message: 'You are not authorized to cancel this invitation' },
        { status: 403 }
      )
    }

    // Delete the invitation
    await prisma.groupInvitation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Invitation cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling group invitation:', error)
    return NextResponse.json(
      { message: 'Error cancelling invitation' },
      { status: 500 }
    )
  }
}
