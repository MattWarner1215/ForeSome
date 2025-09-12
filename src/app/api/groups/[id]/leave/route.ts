import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const groupId = (await params).id

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Check if user is the creator (creators cannot leave their own group)
    if (group.creatorId === session.user.id) {
      return NextResponse.json({ message: 'Cannot leave your own group' }, { status: 400 })
    }

    // Find the member record
    const memberRecord = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id
        }
      }
    })

    if (!memberRecord) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 400 })
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id
        }
      }
    })

    return NextResponse.json({ message: 'Successfully left group' })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}