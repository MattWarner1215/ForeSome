import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface UserStats {
  roundsCreated: number
  roundsJoined: number
  roundsCompleted: number
  roundsWon: number // Based on ratings if available
  differentCoursesPlayed: number
  averageRating: number
  totalRatingsReceived: number
  groupsCreated: number
  groupsJoined: number
  favoritePartner?: {
    name: string
    count: number
  }
  achievements: Achievement[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: {
    current: number
    target: number
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parallel queries for better performance
    const [
      createdMatches,
      playedMatches,
      completedMatches,
      ratings,
      uniqueCourses,
      createdGroups,
      joinedGroups
    ] = await Promise.all([
      // Rounds created
      prisma.match.count({
        where: { creatorId: userId }
      }),

      // Rounds joined (including created ones)
      prisma.matchPlayer.count({
        where: { 
          playerId: userId,
          status: 'accepted'
        }
      }),

      // Completed rounds (created + joined)
      prisma.match.count({
        where: {
          OR: [
            { creatorId: userId },
            { 
              players: {
                some: {
                  playerId: userId,
                  status: 'accepted'
                }
              }
            }
          ],
          status: 'completed'
        }
      }),

      // User ratings received
      prisma.rating.findMany({
        where: { ratedUserId: userId },
        select: { value: true }
      }),

      // Unique courses played
      prisma.match.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { 
              players: {
                some: {
                  playerId: userId,
                  status: 'accepted'
                }
              }
            }
          ],
          status: 'completed'
        },
        select: { course: true },
        distinct: ['course']
      }),

      // Groups created
      prisma.group.count({
        where: { creatorId: userId }
      }),

      // Groups joined
      prisma.groupMember.count({
        where: { userId: userId }
      })
    ])

    // Calculate average rating
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
      : 0

    // Find favorite playing partner
    const partnerCounts = await prisma.match.groupBy({
      by: ['creatorId'],
      where: {
        players: {
          some: {
            playerId: userId,
            status: 'accepted'
          }
        },
        status: 'completed'
      },
      _count: {
        creatorId: true
      },
      orderBy: {
        _count: {
          creatorId: 'desc'
        }
      },
      take: 1
    })

    let favoritePartner = undefined
    if (partnerCounts.length > 0) {
      const partner = await prisma.user.findUnique({
        where: { id: partnerCounts[0].creatorId },
        select: { name: true, email: true }
      })
      
      if (partner) {
        favoritePartner = {
          name: partner.name || partner.email,
          count: partnerCounts[0]._count.creatorId
        }
      }
    }

    // Calculate total rounds joined (created + accepted as player)
    const totalRoundsJoined = createdMatches + playedMatches

    // Define achievements
    const achievements: Achievement[] = [
      {
        id: 'first_round',
        title: 'Getting Started',
        description: 'Create your first golf round',
        icon: 'faGolfBall',
        unlocked: createdMatches >= 1,
        progress: { current: Math.min(createdMatches, 1), target: 1 }
      },
      {
        id: 'round_creator',
        title: 'Round Master',
        description: 'Create 10 golf rounds',
        icon: 'faCalendarPlus',
        unlocked: createdMatches >= 10,
        progress: { current: Math.min(createdMatches, 10), target: 10 }
      },
      {
        id: 'social_golfer',
        title: 'Social Golfer',
        description: 'Join 25 golf rounds',
        icon: 'faUsers',
        unlocked: totalRoundsJoined >= 25,
        progress: { current: Math.min(totalRoundsJoined, 25), target: 25 }
      },
      {
        id: 'course_explorer',
        title: 'Course Explorer',
        description: 'Play at 5 different golf courses',
        icon: 'faMapMarkedAlt',
        unlocked: uniqueCourses.length >= 5,
        progress: { current: Math.min(uniqueCourses.length, 5), target: 5 }
      },
      {
        id: 'finisher',
        title: 'Round Finisher',
        description: 'Complete 10 golf rounds',
        icon: 'faFlag',
        unlocked: completedMatches >= 10,
        progress: { current: Math.min(completedMatches, 10), target: 10 }
      },
      {
        id: 'highly_rated',
        title: 'Fan Favorite',
        description: 'Achieve an average rating of 4.5 stars',
        icon: 'faStar',
        unlocked: averageRating >= 4.5 && ratings.length >= 5,
        progress: { 
          current: Math.min(Math.round(averageRating * 10) / 10, 4.5), 
          target: 4.5 
        }
      },
      {
        id: 'group_leader',
        title: 'Group Leader',
        description: 'Create 3 golf groups',
        icon: 'faUserFriends',
        unlocked: createdGroups >= 3,
        progress: { current: Math.min(createdGroups, 3), target: 3 }
      },
      {
        id: 'veteran',
        title: 'Golf Veteran',
        description: 'Complete 50 golf rounds',
        icon: 'faTrophy',
        unlocked: completedMatches >= 50,
        progress: { current: Math.min(completedMatches, 50), target: 50 }
      }
    ]

    const stats: UserStats = {
      roundsCreated: createdMatches,
      roundsJoined: totalRoundsJoined,
      roundsCompleted: completedMatches,
      roundsWon: 0, // Could be calculated based on performance metrics in future
      differentCoursesPlayed: uniqueCourses.length,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatingsReceived: ratings.length,
      groupsCreated: createdGroups,
      groupsJoined: joinedGroups,
      favoritePartner,
      achievements
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}