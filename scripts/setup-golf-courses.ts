#!/usr/bin/env node

/**
 * Script to create GolfCourse table and populate it with data
 */

import { PrismaClient } from '@prisma/client'
import { golfCoursesData } from '../src/data/golf-courses'

const prisma = new PrismaClient()

async function setupGolfCourses() {
  try {
    console.log('🏌️  Setting up golf courses database...')
    
    // First, try to create the table using raw SQL if it doesn't exist
    console.log('📋 Creating GolfCourse table if it doesn\'t exist...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "GolfCourse" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "zipCode" TEXT NOT NULL,
        "country" TEXT NOT NULL DEFAULT 'USA',
        "phone" TEXT,
        "website" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Public',
        "holes" INTEGER DEFAULT 18,
        "par" INTEGER,
        "rating" DOUBLE PRECISION,
        "slope" INTEGER,
        "yards" INTEGER,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "features" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "GolfCourse_pkey" PRIMARY KEY ("id")
      );
    `
    
    console.log('📋 Creating indexes if they don\'t exist...')
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "GolfCourse_zipCode_idx" ON "GolfCourse"("zipCode");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "GolfCourse_city_state_idx" ON "GolfCourse"("city", "state");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "GolfCourse_name_idx" ON "GolfCourse"("name");`
    
    console.log('✅ Table and indexes created successfully')
    
    // Clear existing golf courses
    console.log('🧹 Clearing existing golf courses...')
    await prisma.golfCourse.deleteMany()
    
    // Insert golf courses from static data
    console.log(`💾 Inserting ${golfCoursesData.length} golf courses...`)
    let insertedCount = 0
    let errorCount = 0
    
    for (const course of golfCoursesData) {
      try {
        // Extract city, state, zip from address if not already separated
        let city = course.city
        let state = course.state  
        let zipCode = course.zipCode
        
        // If city/state/zip are not properly set, try to extract from address
        if (!city || !zipCode) {
          const addressMatch = course.address.match(/^(.+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/)
          if (addressMatch) {
            const addressParts = addressMatch[1].split(',')
            city = addressParts[addressParts.length - 1]?.trim() || course.city || 'Unknown'
            state = addressMatch[2] || course.state || 'OH'
            zipCode = addressMatch[3] || course.zipCode || '00000'
          }
        }
        
        await prisma.golfCourse.create({
          data: {
            id: course.id,
            name: course.name,
            address: course.address,
            city: city || 'Unknown',
            state: state || 'OH',
            zipCode: zipCode || '00000',
            country: course.country || 'USA',
            phone: course.phone || null,
            website: course.website || null,
            type: 'Public', // Default to Public for now
            holes: course.holes || 18,
            par: course.par || null,
            rating: course.rating || null,
            slope: course.slope || null,
            yards: course.yards || null,
            latitude: course.latitude || null,
            longitude: course.longitude || null,
            features: null
          }
        })
        
        insertedCount++
        
        if (insertedCount % 10 === 0) {
          console.log(`   Inserted ${insertedCount} courses...`)
        }
      } catch (error) {
        console.warn(`❌ Error inserting course "${course.name}":`, error instanceof Error ? error.message : error)
        errorCount++
      }
    }
    
    console.log(`🎉 Successfully inserted ${insertedCount} golf courses`)
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} courses failed to insert`)
    }
    
    // Display statistics
    const totalCourses = await prisma.golfCourse.count()
    const coursesByState = await prisma.golfCourse.groupBy({
      by: ['state'],
      _count: true
    })
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Total Courses: ${totalCourses}`)
    coursesByState.forEach(group => {
      console.log(`   ${group.state}: ${group._count} courses`)
    })
    
    // Test a few queries
    console.log('\n🧪 Testing queries...')
    const columbusCount = await prisma.golfCourse.count({
      where: { city: { contains: 'Columbus', mode: 'insensitive' } }
    })
    console.log(`   Columbus area courses: ${columbusCount}`)
    
    const championsCourse = await prisma.golfCourse.findFirst({
      where: { name: { contains: 'Champions', mode: 'insensitive' } }
    })
    console.log(`   Found Champions course: ${championsCourse?.name || 'Not found'}`)
    
  } catch (error) {
    console.error('❌ Error setting up golf courses:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  setupGolfCourses()
    .then(() => {
      console.log('✅ Golf courses setup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error)
      process.exit(1)
    })
}

export { setupGolfCourses }