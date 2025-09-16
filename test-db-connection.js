const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('🔍 Testing database connection...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    // Test basic connection
    console.log('📡 Attempting to connect...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Check if User table exists (should exist)
    console.log('📋 Testing User table query...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    // Check if ChatRoom table exists
    console.log('💬 Testing ChatRoom table...')
    try {
      const chatRoomCount = await prisma.chatRoom.count()
      console.log(`✅ ChatRoom table exists with ${chatRoomCount} rooms`)
      
      // Check ChatMessage table
      const messageCount = await prisma.chatMessage.count()
      console.log(`✅ ChatMessage table exists with ${messageCount} messages`)
      
      console.log('🎉 Chat database is fully set up and ready!')
      
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('⚠️  Chat tables do not exist yet')
        console.log('🔧 Need to run database migration')
        return false
      } else {
        throw error
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
  
  return true
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n🚀 Database is ready for production chat!')
    } else {
      console.log('\n🔄 Database migration needed for chat functionality')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })