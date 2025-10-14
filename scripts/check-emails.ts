import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkEmails() {
  try {
    const emails = await prisma.emailRegistration.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log('\n📧 Email Registrations:')
    console.log('='.repeat(80))

    if (emails.length === 0) {
      console.log('No emails found in database.')
    } else {
      console.log(`Found ${emails.length} email registration(s):\n`)
      emails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.email}`)
        console.log(`   Source: ${email.source}`)
        console.log(`   IP: ${email.ipAddress}`)
        console.log(`   Created: ${email.createdAt}`)
        console.log(`   Updated: ${email.updatedAt}`)
        console.log('')
      })
    }

    console.log('='.repeat(80))
  } catch (error) {
    console.error('Error checking emails:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmails()
