#!/usr/bin/env node

/**
 * Script to check database schema
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Check Match table columns
    const matchColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Match' 
      ORDER BY ordinal_position;
    `
    
    console.log('\n📋 Match table columns:')
    console.table(matchColumns)
    
    // Check MatchPlayer table columns  
    const matchPlayerColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'MatchPlayer' 
      ORDER BY ordinal_position;
    `
    
    console.log('\n📋 MatchPlayer table columns:')
    console.table(matchPlayerColumns)
    
    // Test a simple query
    console.log('\n🧪 Testing simple match query...')
    const matchCount = await prisma.match.count()
    console.log(`   Total matches: ${matchCount}`)
    
  } catch (error) {
    console.error('❌ Error checking schema:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  checkSchema()
    .then(() => {
      console.log('✅ Schema check completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Schema check failed:', error)
      process.exit(1)
    })
}

export { checkSchema }