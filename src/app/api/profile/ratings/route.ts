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

    const ratings = await prisma.rating.findMany({
      where: { ratedUserId: session.user.id },
      include: {
        ratedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Ratings fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}