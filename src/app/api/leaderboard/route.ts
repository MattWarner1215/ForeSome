import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface LeaderboardEntry {
  id: string
  name: string | null
  email: string
  image: string | null
  roundsCompleted: number
  averageRating: number
  totalRatings: number
  roundsCreated: number
  differentCourses: number
  score: number // Calculated overall score
}

export async function GET() {
  try {
    // Get all users with their stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true
      }
    })

    const leaderboard: LeaderboardEntry[] = await Promise.all(
      users.map(async (user) => {
        const [
          roundsCreated,
          roundsCompleted,
          ratings,
          uniqueCourses
        ] = await Promise.all([
          // Rounds created
          prisma.match.count({
            where: { creatorId: user.id }
          }),

          // Completed rounds (created + joined)
          prisma.match.count({
            where: {
              OR: [
                { creatorId: user.id },
                { 
                  players: {
                    some: {
                      playerId: user.id,
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
            where: { ratedUserId: user.id },
            select: { value: true }
          }),

          // Unique courses played
          prisma.match.findMany({
            where: {
              OR: [
                { creatorId: user.id },
                { 
                  players: {
                    some: {
                      playerId: user.id,
                      status: 'accepted'
                    }
                  }
                }
              ],
              status: 'completed'
            },
            select: { course: true },
            distinct: ['course']
          })
        ])

        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
          : 0

        // Calculate overall score (weighted combination of different metrics)
        const score = 
          (roundsCompleted * 10) +           // 10 points per completed round
          (roundsCreated * 15) +             // 15 points per created round
          (uniqueCourses.length * 25) +      // 25 points per unique course
          (averageRating * 20) +             // 20 points per rating point
          (ratings.length * 5)               // 5 points per rating received

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          roundsCompleted,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length,
          roundsCreated,
          differentCourses: uniqueCourses.length,
          score: Math.round(score)
        }
      })
    )

    // Sort by score descending and take top 10
    const topPlayers = leaderboard
      .filter(player => player.score > 0) // Only include players with activity
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return NextResponse.json(topPlayers)
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}