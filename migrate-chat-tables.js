const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

async function createChatTables() {
  console.log('🚀 Creating chat tables for production...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Create ChatRoom table
    console.log('📋 Creating ChatRoom table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ChatRoom" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
      )
    `
    
    // Create unique constraint on matchId
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "ChatRoom_matchId_key" ON "ChatRoom"("matchId")
    `
    
    // Create index on matchId for performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ChatRoom_matchId_idx" ON "ChatRoom"("matchId")
    `

    console.log('✅ ChatRoom table created')

    // Create ChatMessage table
    console.log('📝 Creating ChatMessage table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "chatRoomId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "messageType" TEXT NOT NULL DEFAULT 'text',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
      )
    `

    // Create indexes for performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ChatMessage_chatRoomId_createdAt_idx" ON "ChatMessage"("chatRoomId", "createdAt")
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx" ON "ChatMessage"("senderId")
    `

    console.log('✅ ChatMessage table created')

    // Create foreign key constraints
    console.log('🔗 Adding foreign key constraints...')
    
    // ChatRoom -> Match foreign key
    await prisma.$executeRaw`
      ALTER TABLE "ChatRoom" 
      ADD CONSTRAINT IF NOT EXISTS "ChatRoom_matchId_fkey" 
      FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `

    // ChatMessage -> ChatRoom foreign key
    await prisma.$executeRaw`
      ALTER TABLE "ChatMessage" 
      ADD CONSTRAINT IF NOT EXISTS "ChatMessage_chatRoomId_fkey" 
      FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `

    // ChatMessage -> User foreign key
    await prisma.$executeRaw`
      ALTER TABLE "ChatMessage" 
      ADD CONSTRAINT IF NOT EXISTS "ChatMessage_senderId_fkey" 
      FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `

    console.log('✅ Foreign key constraints added')

    // Test the tables
    console.log('🧪 Testing new tables...')
    const chatRoomCount = await prisma.chatRoom.count()
    const messageCount = await prisma.chatMessage.count()
    
    console.log(`✅ ChatRoom table working: ${chatRoomCount} rooms`)
    console.log(`✅ ChatMessage table working: ${messageCount} messages`)
    
    console.log('\n🎉 Chat database migration completed successfully!')
    console.log('💬 Real-time chat is now ready for production!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createChatTables()
  .then(() => {
    console.log('\n✨ Chat tables ready! Restart your development server to use the production chat.')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Migration error:', error)
    process.exit(1)
  })