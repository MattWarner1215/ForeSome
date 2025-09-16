import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zipCode')
    const myMatches = searchParams.get('myMatches') === 'true'
    const publicParam = searchParams.get('public')
    const publicOnly = publicParam === 'true'
    const privateOnly = publicParam === 'false'
    const showCompleted = searchParams.get('showCompleted') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Helper function to add active match filters (non-completed, non-cancelled, future matches)
    const addActiveMatchFilters = (clause: any) => {
      if (!showCompleted) {
        // Add both status and date filters
        return {
          ...clause,
          status: { notIn: ['completed', 'cancelled'] },
          date: { gte: new Date() }
        }
      }
      return clause
    }

    let whereClause: any = {}

    if (myMatches) {
      whereClause = addActiveMatchFilters({
        OR: [
          { creatorId: session.user.id },
          { players: { some: { playerId: session.user.id } } }
        ]
      })
    } else if (publicOnly) {
      whereClause = addActiveMatchFilters({
        isPublic: true,
        creatorId: {
          not: session.user.id
        }
      })
    } else if (privateOnly) {
      // Private matches: matches created by members of groups I'm connected to (excluding my own matches)
      try {
        // Get all connected user IDs in a single optimized query
        const groups = await prisma.group.findMany({
          where: {
            OR: [
              { creatorId: session.user.id },
              { members: { some: { userId: session.user.id } } }
            ]
          },
          include: {
            members: {
              select: { userId: true }
            }
          }
        })
        
        const connectedUserIds = new Set<string>()
        
        groups.forEach(group => {
          // Add group creator if not current user
          if (group.creatorId !== session.user.id) {
            connectedUserIds.add(group.creatorId)
          }
          
          // Add all members except current user
          group.members.forEach(member => {
            if (member.userId !== session.user.id) {
              connectedUserIds.add(member.userId)
            }
          })
        })
        
        const connectedUserIdsArray = Array.from(connectedUserIds)
        
        // If no connected users, return empty results
        if (connectedUserIdsArray.length === 0) {
          whereClause = addActiveMatchFilters({
            id: 'no-rounds-found' // This will return no rounds
          })
        } else {
          whereClause = addActiveMatchFilters({
            creatorId: {
              in: connectedUserIdsArray
            },
            isPublic: false // Only show private rounds from group members
          })
        }
      } catch (error) {
        console.error('Error fetching connected users for private rounds:', error)
        // If there's an error, return empty results
        whereClause = addActiveMatchFilters({
          id: 'no-rounds-found'
        })
      }
    } else if (zipCode) {
      whereClause = addActiveMatchFilters({
        zipCode: zipCode,
        isPublic: true,
        creatorId: {
          not: session.user.id
        }
      })
    } else {
      whereClause = addActiveMatchFilters({
        isPublic: true,
        creatorId: {
          not: session.user.id
        }
      })
    }

    const rounds = await prisma.match.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            handicap: true
          }
        },
        players: {
          include: {
            player: {
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
            players: {
              where: { status: 'accepted' }
            }
          }
        }
      },
      orderBy: { date: 'asc' },
      ...(limit && { take: limit })
    })

    // Fetch course features for all unique course names
    const courseNames = Array.from(new Set(rounds.map(round => round.course)))
    const courseFeatures = new Map<string, string>()
    
    if (courseNames.length > 0) {
      const courses = await prisma.golfCourse.findMany({
        where: {
          name: {
            in: courseNames,
            mode: 'insensitive'
          }
        },
        select: {
          name: true,
          features: true
        }
      })
      
      courses.forEach(course => {
        if (course.features) {
          courseFeatures.set(course.name.toLowerCase(), course.features)
        }
      })
    }

    // Enrich rounds with user status and pending request counts efficiently
    const enrichedRounds = rounds.map((round) => {
      // Get user's status from the already loaded players
      const userRequest = round.players.find(p => p.playerId === session.user.id)
      const userStatus = userRequest?.status || null

      // Get pending requests count from already loaded players if user is creator
      let pendingRequestsCount = 0
      if (round.creatorId === session.user.id) {
        pendingRequestsCount = round.players.filter(p => p.status === 'pending').length
      }

      // Get course features
      const courseFeatures_ = courseFeatures.get(round.course.toLowerCase())

      return {
        ...round,
        // Filter players to only show accepted ones for the response
        players: round.players.filter(p => p.status === 'accepted'),
        userStatus,
        pendingRequestsCount: round.creatorId === session.user.id ? pendingRequestsCount : undefined,
        courseFeatures: courseFeatures_ || undefined
      }
    })

    // Add caching headers for better performance
    const response = NextResponse.json(enrichedRounds)
    
    // Cache for 1 minute for my matches, 30 seconds for public matches
    const cacheTime = myMatches ? 60 : 30
    response.headers.set('Cache-Control', `private, max-age=${cacheTime}, stale-while-revalidate=60`)
    response.headers.set('X-Cache-Tag', `matches-${session.user.id}`)
    
    return response
  } catch (error) {
    console.error('Rounds fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      course,
      address,
      zipCode,
      date,
      time,
      maxPlayers,
      isPublic,
      selectedGroups = []
    } = await request.json()

    if (!title || !course || !address || !zipCode || !date || !time) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Combine date and time
    const matchDateTime = new Date(`${date}T${time}`)

    if (matchDateTime <= new Date()) {
      return NextResponse.json(
        { message: 'Match date must be in the future' },
        { status: 400 }
      )
    }

    // Validate private round requirements
    if (isPublic === 'false' && (!selectedGroups || selectedGroups.length === 0)) {
      return NextResponse.json(
        { message: 'Private rounds must be shared with at least one group' },
        { status: 400 }
      )
    }

    // Verify user belongs to selected groups (for security)
    if (isPublic === 'false' && selectedGroups.length > 0) {
      // Get groups where user is a member
      const userGroupMemberships = await prisma.groupMember.findMany({
        where: {
          userId: session.user.id,
          groupId: {
            in: selectedGroups
          }
        },
        select: { groupId: true }
      })
      
      // Get groups where user is the creator
      const userOwnedGroups = await prisma.group.findMany({
        where: {
          creatorId: session.user.id,
          id: {
            in: selectedGroups
          }
        },
        select: { id: true }
      })
      
      // Combine both member groups and owned groups
      const memberGroupIds = userGroupMemberships.map(m => m.groupId)
      const ownedGroupIds = userOwnedGroups.map(g => g.id)
      const allUserGroupIds = Array.from(new Set([...memberGroupIds, ...ownedGroupIds]))
      
      const invalidGroups = selectedGroups.filter((groupId: string) => !allUserGroupIds.includes(groupId))
      
      if (invalidGroups.length > 0) {
        return NextResponse.json(
          { message: 'You can only share rounds with groups you belong to' },
          { status: 403 }
        )
      }
    }

    const round = await prisma.match.create({
      data: {
        title,
        description,
        course,
        address,
        zipCode,
        date: matchDateTime,
        time,
        maxPlayers: parseInt(maxPlayers),
        isPublic: isPublic === 'true',
        creatorId: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            handicap: true
          }
        },
        players: {
          where: {
            status: 'accepted'
          },
          include: {
            player: {
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
            players: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    // Create GroupMatch entries for private rounds
    if (isPublic === 'false' && selectedGroups.length > 0) {
      const groupMatchData = selectedGroups.map((groupId: string) => ({
        groupId,
        matchId: round.id
      }))

      await prisma.groupMatch.createMany({
        data: groupMatchData,
        skipDuplicates: true
      })
    }

    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    console.error('Round creation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}