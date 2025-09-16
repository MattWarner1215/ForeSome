import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const zipCode = searchParams.get('zipCode') || ''
    const city = searchParams.get('city') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query && !zipCode && !city) {
      return NextResponse.json({ courses: [] })
    }

    // Build the where clause for Prisma
    const whereClause: any = {
      AND: []
    }

    // Search by name or city if query provided
    if (query) {
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
          }
        ]
      })
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
      orderBy: {
        name: 'asc'
      },
      take: limit * 2 // Get more to allow for deduplication
    })

    // Deduplicate by course name (case-insensitive)
    const seenNames = new Set<string>()
    const uniqueCourses = courses.filter(course => {
      const normalizedName = course.name.toLowerCase().trim()
      if (seenNames.has(normalizedName)) {
        return false
      }
      seenNames.add(normalizedName)
      return true
    }).slice(0, limit) // Take only the requested limit after deduplication

    return NextResponse.json({ courses: uniqueCourses })
  } catch (error) {
    console.error('Golf course search error:', error)
    return NextResponse.json(
      { error: 'Failed to search golf courses' },
      { status: 500 }
    )
  }
}