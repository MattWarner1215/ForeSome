import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get groups where user is creator or member, sorted with owned groups first
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        isPrivate: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
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
            members: true,
            groupMatches: true
          }
        }
      },
      orderBy: [
        // Order by ownership status first (owned groups first), then by creation date
        { creatorId: session.user.id ? 'desc' : 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Sort groups to ensure owned groups appear first
    const sortedGroups = groups.sort((a, b) => {
      const aIsOwned = a.creatorId === session.user.id
      const bIsOwned = b.creatorId === session.user.id
      
      // If both are owned or both are not owned, sort by creation date (newest first)
      if (aIsOwned === bIsOwned) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      
      // Owned groups first
      return aIsOwned ? -1 : 1
    })

    return NextResponse.json(sortedGroups)
  } catch (error) {
    console.error('Groups fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, isPrivate, memberIds } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'Group name is required' },
        { status: 400 }
      )
    }

    // Validate member IDs if provided
    let validMemberIds: string[] = []
    if (memberIds && Array.isArray(memberIds)) {
      // Remove duplicates and filter out creator ID
      const filteredIds = memberIds.filter((id: string) => id !== session.user.id)
      const uniqueIds = Array.from(new Set(filteredIds))
      
      // Verify that all member IDs exist
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true }
      })
      
      validMemberIds = existingUsers.map(user => user.id)
    }

    // Create group and send invitations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the group
      const group = await tx.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isPrivate: Boolean(isPrivate),
          creatorId: session.user.id
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
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
              members: true,
              groupMatches: true
            }
          }
        }
      })

      // Send invitations to selected members
      if (validMemberIds.length > 0) {
        await tx.groupInvitation.createMany({
          data: validMemberIds.map(memberId => ({
            groupId: group.id,
            inviterId: session.user.id,
            inviteeId: memberId,
            status: 'pending'
          }))
        })

        // Create notifications for each invitee
        await tx.notification.createMany({
          data: validMemberIds.map(memberId => ({
            type: 'group_invitation',
            title: 'Group Invitation',
            message: `You've been invited to join "${group.name}"`,
            userId: memberId,
            senderId: session.user.id,
            groupId: group.id
          }))
        })
      }

      return group
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Group creation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}