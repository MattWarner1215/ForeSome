import { config } from 'dotenv'
import { resolve } from 'path'
import { EmailService } from '../src/lib/email'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

async function testEmail() {
  console.log('🔑 Environment Check:')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Missing')
  console.log('')
  console.log('🧪 Testing email notification system...\n')

  try {
    // Test sending a join request email
    console.log('📧 Sending test join request email...')

    const result = await EmailService.sendJoinRequestEmail(
      'mattwarner76@gmail.com', // Your email
      'Matt',
      'John Doe',
      'Saturday Morning Golf at Muirfield Village',
      'December 7, 2024',
      '9:00 AM',
      'test-match-id-123'
    )

    if (result) {
      console.log('✅ Email sent successfully!')
      console.log('📬 Check your inbox at: mattwarner76@gmail.com')
      console.log('\nEmail details:', result)
    } else {
      console.log('⚠️  Email service returned null (check your RESEND_API_KEY)')
    }
  } catch (error) {
    console.error('❌ Error sending email:', error)
  }
}

testEmail()
