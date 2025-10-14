import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zipCode')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get public rounds with their golf course coordinates
    let whereClause: any = {
      isPublic: true,
      creatorId: {
        not: session.user.id
      },
      status: { notIn: ['completed', 'cancelled'] },
      date: { gte: new Date() }
    }

    // If zipCode is provided, add it to the filter
    if (zipCode) {
      whereClause.zipCode = zipCode
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
        _count: {
          select: {
            players: {
              where: { status: 'accepted' }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Debug: Log all rounds found
    console.log(`[LOCATIONS API] Rounds found for user ${session.user.id}:`, rounds.map(r => ({
      id: r.id,
      title: r.title,
      course: r.course,
      creator: r.creator.name || r.creator.email,
      creatorId: r.creatorId,
      isPublic: r.isPublic
    })))

    // Get unique course names to match with golf course database
    const courseNames = Array.from(new Set(rounds.map(round => round.course).filter(course => course && course.trim())))
    console.log(`[LOCATIONS API] Course names to match:`, courseNames)

    // Fetch coordinates from golf course database - get all courses with coordinates
    const golfCourses = await prisma.golfCourse.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true
      }
    })

    console.log(`[LOCATIONS API] Golf courses found:`, golfCourses.map(c => `${c.name} | ${c.address} | ${c.city}`))
    console.log(`[LOCATIONS API] Total golf courses with coords in DB:`, golfCourses.length)

    // Create a map of course details to coordinates
    const courseCoordinates = new Map<string, { lat: number; lng: number }>()

    golfCourses.forEach(course => {
      if (course.latitude && course.longitude) {
        const coords = { lat: course.latitude, lng: course.longitude }

        // Create multiple keys for flexible matching
        const courseNameLower = course.name.toLowerCase()
        const courseNameWords = courseNameLower.split(/\s+/)

        // Store by full name
        courseCoordinates.set(courseNameLower, coords)

        // Store by each significant word (longer than 2 characters)
        courseNameWords.forEach(word => {
          if (word.length > 2) {
            courseCoordinates.set(word, coords)
          }
        })

        // Store by city if available
        if (course.city) {
          courseCoordinates.set(course.city.toLowerCase(), coords)
        }
      }
    })

    // Enrich rounds with coordinates using improved matching
    const roundsWithCoordinates = rounds.map(round => {
      let coordinates: { lat: number; lng: number } | undefined

      // Try exact course name match first
      const courseNameLower = round.course.toLowerCase()
      coordinates = courseCoordinates.get(courseNameLower)

      // If no exact match, try fuzzy matching with golf course names from database
      if (!coordinates) {
        for (const course of golfCourses) {
          const dbCourseNameLower = course.name.toLowerCase()

          // Check for partial matches or similar names
          if (dbCourseNameLower.includes('virtues') && courseNameLower.includes('virtues')) {
            coordinates = { lat: course.latitude!, lng: course.longitude! }
            console.log(`[MATCH] Fuzzy match: "${round.course}" -> "${course.name}"`)
            break
          }

          // Check for other common variations
          if (courseNameLower.includes('longaberger') && dbCourseNameLower.includes('virtues')) {
            coordinates = { lat: course.latitude!, lng: course.longitude! }
            console.log(`[MATCH] Alias match: "${round.course}" -> "${course.name}"`)
            break
          }

          // Try matching by significant words (length > 4) but avoid generic words
          const roundWords = courseNameLower.split(/\s+/).filter(w => w.length > 4 && !['golf', 'club', 'course'].includes(w))
          const dbWords = dbCourseNameLower.split(/\s+/).filter(w => w.length > 4 && !['golf', 'club', 'course'].includes(w))

          for (const roundWord of roundWords) {
            for (const dbWord of dbWords) {
              if (roundWord === dbWord) {
                coordinates = { lat: course.latitude!, lng: course.longitude! }
                console.log(`[MATCH] Word match: "${round.course}" -> "${course.name}" (${roundWord})`)
                break
              }
            }
            if (coordinates) break
          }
          if (coordinates) break
        }
      }

      // Skip the overly broad word-based matching that was causing incorrect matches
      // The previous logic was matching everything with "golf" to "The Virtues Golf Club"

      // Try matching by city if address is available
      if (!coordinates && round.address) {
        const addressParts = round.address.split(',')
        for (const part of addressParts) {
          const trimmedPart = part.trim().toLowerCase()
          coordinates = courseCoordinates.get(trimmedPart)
          if (coordinates) {
            console.log(`[MATCH] City match: "${round.course}" -> found via city "${trimmedPart}"`)
            break
          }
        }
      }

      console.log(`[MATCH] Final result: "${round.course}" at "${round.address}" -> ${coordinates ? 'FOUND' : 'NOT FOUND'}`)

      return {
        id: round.id,
        title: round.title,
        course: round.course,
        address: round.address,
        zipCode: round.zipCode,
        date: round.date,
        time: round.time,
        maxPlayers: round.maxPlayers,
        creator: round.creator,
        _count: round._count,
        courseLatitude: coordinates?.lat,
        courseLongitude: coordinates?.lng
      }
    }).filter(round => round.courseLatitude && round.courseLongitude) // Only return rounds with coordinates

    console.log(`[LOCATIONS API ${new Date().toISOString()}] Found ${rounds.length} public rounds`)
    console.log(`[LOCATIONS API] Found ${golfCourses.length} golf courses with coordinates`)
    console.log(`[LOCATIONS API] Returning ${roundsWithCoordinates.length} rounds with coordinates`)


    return NextResponse.json(roundsWithCoordinates)
  } catch (error) {
    console.error('Rounds locations fetch error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}