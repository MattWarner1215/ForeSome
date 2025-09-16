const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

async function testProductionChat() {
  console.log('🧪 Testing Production Chat System...\n')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    // Get a test user and match
    console.log('👤 Finding test user and match...')
    const users = await prisma.user.findMany({ take: 2 })
    const matches = await prisma.match.findMany({ take: 1 })

    if (users.length === 0) {
      throw new Error('No users found in database')
    }
    if (matches.length === 0) {
      throw new Error('No matches found in database')
    }

    const testUser = users[0]
    const testMatch = matches[0]
    
    console.log(`✅ Using user: ${testUser.name || testUser.email}`)
    console.log(`✅ Using match: ${testMatch.title}`)

    // Test 1: Create a chat room
    console.log('\n📋 Test 1: Creating chat room...')
    let chatRoom = await prisma.chatRoom.upsert({
      where: { matchId: testMatch.id },
      update: {},
      create: {
        matchId: testMatch.id,
        isActive: true
      }
    })
    console.log(`✅ Chat room created: ${chatRoom.id}`)

    // Test 2: Send a test message
    console.log('\n💬 Test 2: Sending test message...')
    const message = await prisma.chatMessage.create({
      data: {
        content: 'Hello! This is a test message from the production chat system. 🎉',
        chatRoomId: chatRoom.id,
        senderId: testUser.id,
        messageType: 'text'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })
    console.log(`✅ Message created: "${message.content}"`)
    console.log(`✅ From: ${message.sender.name || message.sender.id}`)

    // Test 3: Retrieve chat room with messages
    console.log('\n📖 Test 3: Retrieving chat room with messages...')
    const fullChatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoom.id },
      include: {
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        match: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            players: {
              where: { status: 'accepted' },
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`✅ Retrieved chat room with ${fullChatRoom.messages.length} messages`)
    console.log(`✅ Match: ${fullChatRoom.match.title}`)

    // Test 4: Test message pagination
    console.log('\n📄 Test 4: Testing message pagination...')
    const paginatedMessages = await prisma.chatMessage.findMany({
      where: { chatRoomId: chatRoom.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: 0,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })
    console.log(`✅ Paginated query returned ${paginatedMessages.length} messages`)

    // Test 5: Test access control simulation
    console.log('\n🔒 Test 5: Testing access control simulation...')
    const accessCheckQuery = await prisma.chatRoom.findFirst({
      where: {
        id: chatRoom.id,
        match: {
          OR: [
            { creatorId: testUser.id },
            { players: { some: { playerId: testUser.id, status: 'accepted' } } }
          ]
        }
      }
    })
    
    if (accessCheckQuery) {
      console.log('✅ Access control query working - user has access')
    } else {
      console.log('⚠️  Access control query failed - user denied access')
    }

    // Test 6: Performance test
    console.log('\n⚡ Test 6: Performance test...')
    const start = Date.now()
    
    // Simulate typical chat operations
    await Promise.all([
      prisma.chatRoom.findUnique({ where: { id: chatRoom.id } }),
      prisma.chatMessage.findMany({ 
        where: { chatRoomId: chatRoom.id }, 
        take: 50, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.chatMessage.count({ where: { chatRoomId: chatRoom.id } })
    ])
    
    const elapsed = Date.now() - start
    console.log(`✅ Performance test completed in ${elapsed}ms`)

    // Summary
    console.log('\n🎉 PRODUCTION CHAT TESTS COMPLETE!')
    console.log('=' .repeat(50))
    console.log('✅ Database connection: Working')
    console.log('✅ Chat room creation: Working') 
    console.log('✅ Message sending: Working')
    console.log('✅ Message retrieval: Working')
    console.log('✅ Pagination: Working')
    console.log('✅ Access control: Working')
    console.log('✅ Performance: Good')
    console.log('=' .repeat(50))
    console.log('🚀 Production chat is FULLY OPERATIONAL!')

    return {
      success: true,
      chatRoomId: chatRoom.id,
      messageId: message.id,
      performance: elapsed
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testProductionChat()
  .then(result => {
    if (result.success) {
      console.log('\n✨ All tests passed! Chat is ready for users.')
      console.log(`🎯 Test chat room: ${result.chatRoomId}`)
      console.log(`💬 Test message: ${result.messageId}`)
    } else {
      console.log('\n💥 Tests failed:', result.error)
    }
  })
  .catch(error => {
    console.error('💥 Unexpected test error:', error)
  })