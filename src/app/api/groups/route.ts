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

    // Get groups where user is creator or member
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(groups)
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

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPrivate: Boolean(isPrivate),
        creatorId: session.user.id,
        // Add members if any were provided
        members: validMemberIds.length > 0 ? {
          create: validMemberIds.map(memberId => ({
            userId: memberId,
            role: 'member'
          }))
        } : undefined
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

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Group creation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}