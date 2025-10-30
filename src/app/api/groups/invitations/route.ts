import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's pending group invitations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const invitations = await prisma.groupInvitation.findMany({
      where: {
        inviteeId: session.user.id,
        status: 'pending'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            isPrivate: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching group invitations:', error)
    return NextResponse.json(
      { message: 'Error fetching invitations' },
      { status: 500 }
    )
  }
}

// POST - Send group invitation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, inviteeId } = await request.json()

    if (!groupId || !inviteeId) {
      return NextResponse.json(
        { message: 'Group ID and invitee ID are required' },
        { status: 400 }
      )
    }

    // Verify the user is the group creator or admin
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      )
    }

    const isCreator = group.creatorId === session.user.id
    const isAdmin = group.members.some(m => m.userId === session.user.id && m.role === 'admin')

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { message: 'Only group creators and admins can send invitations' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: inviteeId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { message: 'User is already a member of this group' },
        { status: 400 }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.groupInvitation.findUnique({
      where: {
        groupId_inviteeId: {
          groupId,
          inviteeId
        }
      }
    })

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return NextResponse.json(
          { message: 'Invitation already sent' },
          { status: 400 }
        )
      } else {
        // Update existing declined invitation back to pending
        const updatedInvitation = await prisma.groupInvitation.update({
          where: { id: existingInvitation.id },
          data: {
            status: 'pending',
            inviterId: session.user.id,
            updatedAt: new Date()
          }
        })

        // Create notification
        await prisma.notification.create({
          data: {
            type: 'group_invitation',
            title: 'Group Invitation',
            message: `You've been invited to join "${group.name}"`,
            userId: inviteeId,
            senderId: session.user.id,
            groupId: groupId
          }
        })

        return NextResponse.json(updatedInvitation)
      }
    }

    // Create new invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        groupId,
        inviterId: session.user.id,
        inviteeId,
        status: 'pending'
      }
    })

    // Create notification for the invitee
    await prisma.notification.create({
      data: {
        type: 'group_invitation',
        title: 'Group Invitation',
        message: `You've been invited to join "${group.name}"`,
        userId: inviteeId,
        senderId: session.user.id,
        groupId: groupId
      }
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error sending group invitation:', error)
    return NextResponse.json(
      { message: 'Error sending invitation' },
      { status: 500 }
    )
  }
}
