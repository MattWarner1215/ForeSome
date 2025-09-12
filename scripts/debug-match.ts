#!/usr/bin/env node

/**
 * Script to debug match data structure
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugMatch() {
  try {
    console.log('🔍 Debugging match structure...')
    
    // Get the recent match from the logs
    const matchId = 'cmfae5kh90001dqdur04pd2y1'
    
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        players: {
          include: {
            player: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })
    
    if (!match) {
      console.log('❌ Match not found')
      return
    }
    
    console.log('\n📋 Match Details:')
    console.log(`   ID: ${match.id}`)
    console.log(`   Title: ${match.title}`)
    console.log(`   Status: ${match.status}`)
    console.log(`   Creator: ${match.creator.name || match.creator.email} (${match.creator.id})`)
    console.log(`   Total Players: ${match.players.length}`)
    
    console.log('\n👥 Players:')
    match.players.forEach((mp, index) => {
      console.log(`   ${index + 1}. ${mp.player.name || mp.player.email} (${mp.player.id}) - Status: ${mp.status}`)
    })
    
    // Check accepted players only
    const acceptedPlayers = match.players.filter(p => p.status === 'accepted')
    console.log(`\n✅ Accepted Players: ${acceptedPlayers.length}`)
    acceptedPlayers.forEach((mp, index) => {
      console.log(`   ${index + 1}. ${mp.player.name || mp.player.email}`)
    })
    
    // Simulate what the rating system would see
    console.log('\n🌟 Players to Rate (simulation):')
    const playersToRate = []
    
    // Add creator if different from current user (simulate user id)
    const currentUserId = match.creator.id // Simulate rating as someone else
    if (match.creatorId !== currentUserId) {
      playersToRate.push({
        playerId: match.creatorId,
        name: match.creator.name || match.creator.email,
        type: 'creator'
      })
    }
    
    // Add accepted players if different from current user
    acceptedPlayers.forEach(p => {
      if (p.player.id !== currentUserId) {
        playersToRate.push({
          playerId: p.player.id,
          name: p.player.name || p.player.email,
          type: 'player'
        })
      }
    })
    
    console.log(`   Players to rate: ${playersToRate.length}`)
    playersToRate.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name} (${p.type})`)
    })
    
  } catch (error) {
    console.error('❌ Error debugging match:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  debugMatch()
    .then(() => {
      console.log('✅ Debug completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Debug failed:', error)
      process.exit(1)
    })
}

export { debugMatch }