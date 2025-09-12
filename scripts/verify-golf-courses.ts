import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function verifyGolfCourses() {
  try {
    const totalCourses = await prisma.golfCourse.count()
    const ohioCourses = await prisma.golfCourse.count({
      where: {
        state: 'OH'
      }
    })
    
    console.log(`✅ Total golf courses in database: ${totalCourses}`)
    console.log(`✅ Ohio golf courses: ${ohioCourses}`)
    
    // Show last 5 added courses
    const recentCourses = await prisma.golfCourse.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        name: true,
        city: true,
        state: true,
        createdAt: true
      }
    })
    
    console.log('\n🏌️ Recently added courses:')
    recentCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} - ${course.city}, ${course.state} (${course.createdAt.toLocaleDateString()})`)
    })
    
  } catch (error) {
    console.error('❌ Error verifying golf courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyGolfCourses()