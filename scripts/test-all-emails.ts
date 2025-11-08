import { config } from 'dotenv'
import { resolve } from 'path'
import { EmailService } from '../src/lib/email'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

async function testAllEmails() {
  console.log('🔑 Environment Check:')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Missing')
  console.log('')
  console.log('🧪 Testing all email notification types...\n')

  const recipientEmail = 'mattwarner76@gmail.com'

  try {
    // 1. Join Request Email
    console.log('📧 1/5 Sending Join Request email...')
    await EmailService.sendJoinRequestEmail(
      recipientEmail,
      'Matt',
      'John Doe',
      'Saturday Morning Golf at Muirfield Village',
      'December 14, 2024',
      '9:00 AM',
      'test-match-id-123'
    )
    console.log('✅ Join Request email sent!\n')
    await sleep(2000)

    // 2. Join Approved Email
    console.log('📧 2/5 Sending Join Approved email...')
    await EmailService.sendJoinApprovedEmail(
      recipientEmail,
      'Matt',
      'Sunday Afternoon Round at Scioto Country Club',
      'December 15, 2024',
      '2:00 PM',
      'Scioto Country Club',
      'test-match-id-456'
    )
    console.log('✅ Join Approved email sent!\n')
    await sleep(2000)

    // 3. Join Declined Email
    console.log('📧 3/5 Sending Join Declined email...')
    await EmailService.sendJoinDeclinedEmail(
      recipientEmail,
      'Matt',
      'Friday Evening Golf at The Golf Club',
      'Sorry, the group is already full with players of similar skill levels.'
    )
    console.log('✅ Join Declined email sent!\n')
    await sleep(2000)

    // 4. Group Invitation Email
    console.log('📧 4/5 Sending Group Invitation email...')
    await EmailService.sendGroupInvitationEmail(
      recipientEmail,
      'Matt',
      'Sarah Johnson',
      'Weekend Warriors Golf Club',
      'test-group-id-789'
    )
    console.log('✅ Group Invitation email sent!\n')
    await sleep(2000)

    // 5. Match Update Email
    console.log('📧 5/5 Sending Match Update email...')
    await EmailService.sendMatchUpdateEmail(
      recipientEmail,
      'Matt',
      'Wednesday Evening Golf at Colonial Country Club',
      'Tee time changed from 5:00 PM to 5:30 PM due to course maintenance.',
      'test-match-id-999'
    )
    console.log('✅ Match Update email sent!\n')

    console.log('🎉 All 5 email samples sent successfully!')
    console.log('📬 Check your inbox at:', recipientEmail)
    console.log('\nEmail Types Sent:')
    console.log('  1. ⛳ Join Request')
    console.log('  2. ✅ Join Approved')
    console.log('  3. ℹ️  Join Declined')
    console.log('  4. 👥 Group Invitation')
    console.log('  5. 🔔 Match Update')

  } catch (error) {
    console.error('❌ Error sending emails:', error)
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

testAllEmails()
