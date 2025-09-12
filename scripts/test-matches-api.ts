#!/usr/bin/env node

/**
 * Script to test matches API directly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMatchesApi() {
  try {
    console.log('🔍 Testing matches API logic...')
    
    // Test the query directly with Prisma
    const testUserId = 'cmf77u0sr0000dqkba02pktmn' // From the logs
    
    // Test myMatches query
    console.log('\n📋 Testing myMatches query...')
    const myMatches = await prisma.match.findMany({
      where: {
        OR: [
          { creatorId: testUserId },
          { players: { some: { playerId: testUserId } } }
        ],
        date: { gte: new Date() }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, handicap: true }
        },
        players: {
          include: {
            player: {
              select: { id: true, name: true, email: true, handicap: true }
            }
          }
        },
        _count: {
          select: {
            players: { where: { status: 'accepted' } }
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    
    console.log(`   Found ${myMatches.length} matches for user`)
    myMatches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.title} - ${match.date.toLocaleDateString()} - Status: ${match.status}`)
    })
    
    // Test public matches query
    console.log('\n🌐 Testing public matches query...')
    const publicMatches = await prisma.match.findMany({
      where: {
        isPublic: true,
        creatorId: { not: testUserId },
        date: { gte: new Date() }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, handicap: true }
        },
        players: {
          include: {
            player: {
              select: { id: true, name: true, email: true, handicap: true }
            }
          }
        },
        _count: {
          select: {
            players: { where: { status: 'accepted' } }
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    })
    
    console.log(`   Found ${publicMatches.length} public matches`)
    publicMatches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.title} - ${match.date.toLocaleDateString()} - Status: ${match.status}`)
    })
    
    // Show all matches for context
    console.log('\n📊 All matches in database:')
    const allMatches = await prisma.match.findMany({
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        isPublic: true,
        creatorId: true
      },
      orderBy: { date: 'desc' }
    })
    
    allMatches.forEach((match, i) => {
      const isCreatedByUser = match.creatorId === testUserId
      const isFuture = match.date > new Date()
      console.log(`   ${i + 1}. ${match.title} - ${match.date.toLocaleDateString()} - Status: ${match.status} - Public: ${match.isPublic} ${isCreatedByUser ? '(YOUR MATCH)' : ''} ${isFuture ? '(FUTURE)' : '(PAST)'}`)
    })
    
  } catch (error) {
    console.error('❌ Error testing matches API:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  testMatchesApi()
    .then(() => {
      console.log('✅ Test completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

export { testMatchesApi }