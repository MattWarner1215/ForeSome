import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/groups/[id]/members/[memberId] - Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: (await params).id },
      select: { creatorId: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can remove members' }, { status: 403 })
    }

    // Check if the member exists
    const member = await prisma.groupMember.findUnique({
      where: { id: (await params).memberId },
      include: { user: true }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing the group creator
    if (member.user.id === group.creatorId) {
      return NextResponse.json({ error: 'Cannot remove group creator' }, { status: 400 })
    }

    // Remove the member
    await prisma.groupMember.delete({
      where: { id: (await params).memberId }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}