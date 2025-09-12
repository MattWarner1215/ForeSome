#!/usr/bin/env node

/**
 * Script to populate the database with golf courses from Golf Course.md
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface GolfCourseData {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string
  website?: string
  type: 'Public' | 'Private' | 'Semi-Private'
  holes?: number
  features?: string
}

function parsePhoneNumber(phone: string): string {
  // Clean up phone number format
  return phone.replace(/[^\d\-\(\)\s\+]/g, '').trim()
}

function extractCityStateZip(address: string): { city: string; state: string; zipCode: string } {
  // Extract city, state, and zip from address line like "Columbus, OH 43224"
  const match = address.match(/^(.+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/)
  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].trim(),
      zipCode: match[3].trim()
    }
  }
  
  // Fallback - try to extract what we can
  const parts = address.split(',')
  const lastPart = parts[parts.length - 1]?.trim() || ''
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/)
  
  if (stateZipMatch) {
    const city = parts.length > 1 ? parts[parts.length - 2]?.trim() || '' : ''
    return {
      city,
      state: stateZipMatch[1],
      zipCode: stateZipMatch[2]
    }
  }
  
  return { city: '', state: 'OH', zipCode: '' }
}

function parseGolfCourseMarkdown(filePath: string): GolfCourseData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const courses: GolfCourseData[] = []
  
  // Split by course entries (### followed by number)
  const courseEntries = content.split(/### \d+\./).slice(1) // Remove first empty part
  
  for (const entry of courseEntries) {
    try {
      const lines = entry.trim().split('\n').filter(line => line.trim() !== '')
      
      if (lines.length === 0) continue
      
      // First line should be the course name
      const nameLine = lines[0].trim()
      if (!nameLine) continue
      
      const course: GolfCourseData = {
        name: nameLine,
        address: '',
        city: '',
        state: 'OH',
        zipCode: '',
        type: 'Public'
      }
      
      // Parse each line for course details
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith('- **Address:**')) {
          const addressMatch = line.match(/- \*\*Address:\*\*\s*(.+)/)
          if (addressMatch) {
            const fullAddress = addressMatch[1]
            course.address = fullAddress
            
            // Extract city, state, zip from address
            const { city, state, zipCode } = extractCityStateZip(fullAddress)
            course.city = city
            course.state = state
            course.zipCode = zipCode
          }
        }
        
        if (line.startsWith('- **Phone:**')) {
          const phoneMatch = line.match(/- \*\*Phone:\*\*\s*(.+)/)
          if (phoneMatch) {
            course.phone = parsePhoneNumber(phoneMatch[1])
          }
        }
        
        if (line.startsWith('- **Website:**')) {
          const websiteMatch = line.match(/- \*\*Website:\*\*\s*(.+)/)
          if (websiteMatch) {
            course.website = websiteMatch[1].trim()
          }
        }
        
        if (line.startsWith('- **Type:**')) {
          const typeMatch = line.match(/- \*\*Type:\*\*\s*(.+)/)
          if (typeMatch) {
            const type = typeMatch[1].trim()
            if (type === 'Private' || type === 'Semi-Private' || type === 'Public') {
              course.type = type
            }
          }
        }
        
        if (line.startsWith('- **Features:**')) {
          const featuresMatch = line.match(/- \*\*Features:\*\*\s*(.+)/)
          if (featuresMatch) {
            course.features = featuresMatch[1].trim()
          }
        }
      }
      
      // Only add courses that have at minimum a name and some address info
      if (course.name && (course.address || course.city)) {
        courses.push(course)
      }
    } catch (error) {
      console.warn('Error parsing course entry:', error)
      continue
    }
  }
  
  return courses
}

async function populateDatabase() {
  try {
    console.log('🏌️  Starting golf course database population...')
    
    // Clear existing golf courses
    console.log('🧹 Clearing existing golf courses...')
    await prisma.golfCourse.deleteMany()
    
    // Parse the markdown file
    const filePath = path.join(process.cwd(), 'Golf courses.md')
    console.log(`📖 Parsing golf courses from: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Golf Course.md file not found at: ${filePath}`)
    }
    
    const courses = parseGolfCourseMarkdown(filePath)
    console.log(`✅ Parsed ${courses.length} golf courses from markdown file`)
    
    // Insert courses into database
    console.log('💾 Inserting golf courses into database...')
    let insertedCount = 0
    let errorCount = 0
    
    for (const course of courses) {
      try {
        await prisma.golfCourse.create({
          data: {
            name: course.name,
            address: course.address || `${course.city}, ${course.state} ${course.zipCode}`,
            city: course.city || 'Unknown',
            state: course.state,
            zipCode: course.zipCode || '00000',
            phone: course.phone,
            website: course.website,
            type: course.type,
            holes: course.holes || 18,
            features: course.features
          }
        })
        insertedCount++
        
        if (insertedCount % 10 === 0) {
          console.log(`   Inserted ${insertedCount} courses...`)
        }
      } catch (error) {
        console.warn(`❌ Error inserting course "${course.name}":`, error)
        errorCount++
      }
    }
    
    console.log(`🎉 Successfully inserted ${insertedCount} golf courses`)
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} courses failed to insert`)
    }
    
    // Display some statistics
    const totalCourses = await prisma.golfCourse.count()
    const publicCourses = await prisma.golfCourse.count({ where: { type: 'Public' } })
    const privateCourses = await prisma.golfCourse.count({ where: { type: 'Private' } })
    const semiPrivateCourses = await prisma.golfCourse.count({ where: { type: 'Semi-Private' } })
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Total Courses: ${totalCourses}`)
    console.log(`   Public: ${publicCourses}`)
    console.log(`   Private: ${privateCourses}`)
    console.log(`   Semi-Private: ${semiPrivateCourses}`)
    
  } catch (error) {
    console.error('❌ Error populating database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('✅ Golf course population completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { populateDatabase, parseGolfCourseMarkdown }