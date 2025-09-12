#!/usr/bin/env node

/**
 * Script to add status column to existing Match table
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMatchStatus() {
  try {
    console.log('🔧 Adding status column to Match table...')
    
    // Add status column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Match" 
      ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'scheduled';
    `
    
    console.log('✅ Status column added successfully')
    
    // Update existing matches to have 'scheduled' status
    console.log('📝 Updating existing matches to scheduled status...')
    const updateResult = await prisma.$executeRaw`
      UPDATE "Match" 
      SET "status" = 'scheduled' 
      WHERE "status" IS NULL OR "status" = '';
    `
    
    console.log('✅ Updated existing matches')
    
    // Test the query
    console.log('🧪 Testing match queries...')
    const matchCount = await prisma.match.count()
    console.log(`   Total matches: ${matchCount}`)
    
    if (matchCount > 0) {
      const scheduledCount = await prisma.match.count({
        where: { status: 'scheduled' }
      })
      console.log(`   Scheduled matches: ${scheduledCount}`)
    }
    
  } catch (error) {
    console.error('❌ Error adding status column:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  addMatchStatus()
    .then(() => {
      console.log('✅ Match status column setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error)
      process.exit(1)
    })
}

export { addMatchStatus }