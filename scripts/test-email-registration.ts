// Test script to verify EmailRegistration table exists and works
import { prisma } from '../src/lib/prisma'

async function testEmailRegistration() {
  console.log('🧪 Testing EmailRegistration table...\n')

  try {
    // Try to query the table
    const count = await prisma.emailRegistration.count()
    console.log(`✅ EmailRegistration table exists!`)
    console.log(`📊 Current registrations: ${count}`)

    // Get latest registrations
    if (count > 0) {
      const latest = await prisma.emailRegistration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          email: true,
          source: true,
          createdAt: true
        }
      })

      console.log('\n📧 Latest 5 registrations:')
      latest.forEach((reg, i) => {
        console.log(`  ${i + 1}. ${reg.email} (${reg.source}) - ${reg.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('\n📭 No registrations yet. The table is ready to receive emails!')
    }

    console.log('\n✨ Everything is working correctly!')

  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('❌ EmailRegistration table does NOT exist in database')
      console.log('\n🔧 To fix this, run:')
      console.log('   npm run db:push')
      console.log('   or')
      console.log('   bash scripts/setup-email-registration.sh')
    } else {
      console.error('❌ Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testEmailRegistration()
