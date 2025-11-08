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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        emailJoinRequests: true,
        emailJoinApprovals: true,
        emailMatchUpdates: true,
        emailGroupInvitations: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Email preferences fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailNotifications,
      emailJoinRequests,
      emailJoinApprovals,
      emailMatchUpdates,
      emailGroupInvitations
    } = body

    // Validate input
    const booleanFields = {
      emailNotifications,
      emailJoinRequests,
      emailJoinApprovals,
      emailMatchUpdates,
      emailGroupInvitations
    }

    // Check if at least one field is provided
    if (Object.values(booleanFields).every(val => val === undefined)) {
      return NextResponse.json(
        { message: 'No preferences provided' },
        { status: 400 }
      )
    }

    // Filter out undefined values and validate booleans
    const updateData: any = {}
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined) {
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { message: `${key} must be a boolean` },
            { status: 400 }
          )
        }
        updateData[key] = value
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        emailNotifications: true,
        emailJoinRequests: true,
        emailJoinApprovals: true,
        emailMatchUpdates: true,
        emailGroupInvitations: true
      }
    })

    return NextResponse.json({
      message: 'Email preferences updated successfully',
      preferences: user
    })
  } catch (error) {
    console.error('Email preferences update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
