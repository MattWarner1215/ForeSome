import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const zipCode = searchParams.get('zipCode') || ''
    const city = searchParams.get('city') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const fuzzy = searchParams.get('fuzzy') === 'true'
    const sortByDistance = searchParams.get('sortByDistance') === 'true'

    if (!query && !zipCode && !city) {
      return NextResponse.json({ courses: [] })
    }

    // Build the where clause for Prisma
    const whereClause: any = {
      AND: []
    }

    // Search by name or city if query provided
    if (query) {
      if (fuzzy) {
        // Enhanced fuzzy search - split query into words and search for each
        const queryWords = query.toLowerCase().trim().split(/\s+/)
        const searchConditions = queryWords.map(word => ({
          OR: [
            {
              name: {
                contains: word,
                mode: 'insensitive'
              }
            },
            {
              city: {
                contains: word,
                mode: 'insensitive'
              }
            },
            {
              address: {
                contains: word,
                mode: 'insensitive'
              }
            }
          ]
        }))

        whereClause.AND.push({
          AND: searchConditions
        })
      } else {
        // Standard search
        whereClause.AND.push({
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              city: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              address: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        })
      }
    }

    // Filter by zip code if provided
    if (zipCode) {
      whereClause.AND.push({
        zipCode: {
          contains: zipCode
        }
      })
    }

    // Filter by city if provided
    if (city) {
      whereClause.AND.push({
        city: {
          contains: city,
          mode: 'insensitive'
        }
      })
    }

    // If no AND conditions, remove the AND wrapper
    const finalWhere = whereClause.AND.length > 0 ? whereClause : {}

    const courses = await prisma.golfCourse.findMany({
      where: finalWhere,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        website: true,
        type: true,
        holes: true,
        features: true
      },
      orderBy: { name: 'asc' },
      take: limit * 3 // Get more to allow for deduplication and better ranking
    })

    // Deduplicate by course name (case-insensitive)
    const seenNames = new Set<string>()
    let uniqueCourses = courses.filter(course => {
      const normalizedName = course.name.toLowerCase().trim()
      if (seenNames.has(normalizedName)) {
        return false
      }
      seenNames.add(normalizedName)
      return true
    })

    // Sort by distance/relevance if requested
    if (sortByDistance && zipCode) {
      uniqueCourses = uniqueCourses.sort((a, b) => {
        // Prioritize exact zip code matches
        const aZipMatch = a.zipCode === zipCode
        const bZipMatch = b.zipCode === zipCode

        if (aZipMatch && !bZipMatch) return -1
        if (!aZipMatch && bZipMatch) return 1

        // Then prioritize partial zip code matches (first 3 digits)
        const zipPrefix = zipCode.substring(0, 3)
        const aPartialMatch = a.zipCode?.startsWith(zipPrefix)
        const bPartialMatch = b.zipCode?.startsWith(zipPrefix)

        if (aPartialMatch && !bPartialMatch) return -1
        if (!aPartialMatch && bPartialMatch) return 1

        // Finally sort by name
        return a.name.localeCompare(b.name)
      })
    }

    // Enhance search results with relevance scoring for better ranking
    if (query && fuzzy) {
      uniqueCourses = uniqueCourses.sort((a, b) => {
        const queryLower = query.toLowerCase()

        // Exact name matches get highest priority
        const aExactName = a.name.toLowerCase().includes(queryLower)
        const bExactName = b.name.toLowerCase().includes(queryLower)

        if (aExactName && !bExactName) return -1
        if (!aExactName && bExactName) return 1

        // Name starts with query gets second priority
        const aStartsWith = a.name.toLowerCase().startsWith(queryLower)
        const bStartsWith = b.name.toLowerCase().startsWith(queryLower)

        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1

        return a.name.localeCompare(b.name)
      })
    }

    // Take only the requested limit after processing
    const finalCourses = uniqueCourses.slice(0, limit)

    return NextResponse.json({
      courses: finalCourses,
      total: uniqueCourses.length,
      hasMore: uniqueCourses.length > limit
    })
  } catch (error) {
    console.error('Golf course search error:', error)
    return NextResponse.json(
      { error: 'Failed to search golf courses' },
      { status: 500 }
    )
  }
}