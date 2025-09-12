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
      include: {
        ratings: {
          select: {
            value: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const averageRating = user.ratings.length > 0
      ? user.ratings.reduce((sum, rating) => sum + rating.value, 0) / user.ratings.length
      : 0

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      handicap: user.handicap,
      zipCode: user.zipCode,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      averageRating,
      totalRatings: user.ratings.length,
      createdAt: user.createdAt
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { name, handicap, zipCode, bio, phoneNumber } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        handicap: handicap ? parseFloat(handicap) : null,
        zipCode: zipCode || null,
        bio: bio || null,
        phoneNumber: phoneNumber || null,
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      handicap: updatedUser.handicap,
      zipCode: updatedUser.zipCode,
      bio: updatedUser.bio,
      phoneNumber: updatedUser.phoneNumber,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}