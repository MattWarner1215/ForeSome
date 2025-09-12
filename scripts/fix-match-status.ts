#!/usr/bin/env node

/**
 * Script to ensure Match table has status column
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixMatchStatus() {
  try {
    console.log('🔧 Checking and fixing Match status column...')
    
    // Check if status column exists by trying a simple query
    try {
      await prisma.$queryRaw`SELECT status FROM "Match" LIMIT 1`
      console.log('✅ Status column already exists')
    } catch (error) {
      console.log('❌ Status column missing, adding it...')
      
      // Add the status column with default value
      await prisma.$executeRaw`
        ALTER TABLE "Match" 
        ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'scheduled'
      `
      
      console.log('✅ Status column added successfully')
    }
    
    // Update any existing matches without a status to 'scheduled'
    const result = await prisma.$executeRaw`
      UPDATE "Match" 
      SET "status" = 'scheduled' 
      WHERE "status" IS NULL OR "status" = ''
    `
    
    console.log(`✅ Updated ${result} matches to have status = 'scheduled'`)
    
    // Show current status distribution
    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM "Match"
      GROUP BY status
      ORDER BY count DESC
    ` as Array<{ status: string; count: bigint }>
    
    console.log('\n📊 Current match status distribution:')
    statusCounts.forEach(({ status, count }) => {
      console.log(`   ${status}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing match status:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  fixMatchStatus()
    .then(() => {
      console.log('✅ Match status fix completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Fix failed:', error)
      process.exit(1)
    })
}

export { fixMatchStatus }