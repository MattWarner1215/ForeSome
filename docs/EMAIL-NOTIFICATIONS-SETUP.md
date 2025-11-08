# Email Notifications Setup Guide

This guide explains how to set up and use email notifications in ForeSum using Resend.

## Overview

ForeSum uses [Resend](https://resend.com) for sending email notifications to users about app activity. Users can control which types of email notifications they receive through their profile settings.

## Features

- ✅ Join request notifications (when someone wants to join your round)
- ✅ Join approval/decline notifications (when your join request is approved or declined)
- ✅ Match update notifications (when match details change)
- ✅ Group invitation notifications (when you're invited to a group)
- ✅ User-controlled preferences (enable/disable specific notification types)
- ✅ Beautiful HTML email templates
- ✅ Free tier: 3,000 emails/month

## Setup Instructions

### 1. Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (no credit card required)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "ForeSum Production")
5. Copy the API key (starts with `re_`)

### 3. Configure Your Domain (Optional but Recommended)

For production, you should configure your own domain to send emails from (e.g., `noreply@yourdomain.com`):

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

**For development/testing**, you can use Resend's test domain without configuring your own.

### 4. Set Environment Variables

Add these variables to your `.env.local` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"  # Or onboarding@resend.dev for testing
```

**Important**:
- For testing, you can use `onboarding@resend.dev` as the sender
- For production, use your verified domain (e.g., `noreply@foresumgolf.com`)

### 5. Update Azure/Production Environment Variables

If deploying to Azure Container Instance or another production environment, make sure to add these environment variables:

```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 6. Test Email Sending

After setup, test the email functionality:

1. Start your development server: `npm run dev`
2. Create a test round
3. Have another user request to join
4. Check your email inbox for the join request notification

## Email Notification Types

Users can control these notification types from their profile settings:

| Notification Type | Description | Default |
|------------------|-------------|---------|
| **Master Toggle** | Enable/disable all email notifications | ✅ Enabled |
| **Join Requests** | When someone wants to join your round | ✅ Enabled |
| **Join Approvals** | When your join request is approved/declined | ✅ Enabled |
| **Match Updates** | When match details change (time, location, etc.) | ✅ Enabled |
| **Group Invitations** | When you're invited to join a group | ✅ Enabled |

## API Endpoints

### Get Email Preferences

```http
GET /api/profile/email-preferences
Authorization: Required (session)
```

**Response:**
```json
{
  "emailNotifications": true,
  "emailJoinRequests": true,
  "emailJoinApprovals": true,
  "emailMatchUpdates": true,
  "emailGroupInvitations": true
}
```

### Update Email Preferences

```http
PATCH /api/profile/email-preferences
Authorization: Required (session)
Content-Type: application/json

{
  "emailNotifications": false,
  "emailJoinRequests": true
}
```

**Response:**
```json
{
  "message": "Email preferences updated successfully",
  "preferences": {
    "emailNotifications": false,
    "emailJoinRequests": true,
    "emailJoinApprovals": true,
    "emailMatchUpdates": true,
    "emailGroupInvitations": true
  }
}
```

## Email Templates

All email templates are HTML-based with:
- Responsive design (mobile-friendly)
- Modern styling with gradients and shadows
- Clear call-to-action buttons
- Brand colors (green/emerald theme)
- Link to manage email preferences in footer

### Available Templates

1. **Join Request Email** - Sent to round creator when someone requests to join
2. **Join Approved Email** - Sent to requester when their request is approved
3. **Join Declined Email** - Sent to requester when their request is declined
4. **Group Invitation Email** - Sent when user is invited to a group
5. **Match Update Email** - Sent when match details change

## Cost Breakdown

### Resend Pricing

| Tier | Monthly Cost | Emails Included | Additional Cost |
|------|-------------|-----------------|-----------------|
| **Free** | $0 | 3,000 emails | N/A |
| **Pro** | $20 | 50,000 emails | $1 per 1,000 |
| **Enterprise** | Custom | Custom | Custom |

### Estimated Usage for ForeSum

Assuming:
- 100 active users
- Each user creates 2 rounds/month
- Each round gets 3 join requests
- 80% approval rate

**Monthly email volume:**
- Join requests: 100 × 2 × 3 = 600 emails
- Approvals: 600 × 0.8 = 480 emails
- Declines: 600 × 0.2 = 120 emails
- Match updates: 100 × 2 × 2 = 400 emails (2 updates per round)
- Group invites: 100 × 1 = 100 emails

**Total: ~1,700 emails/month** ✅ Fits in free tier!

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly in environment variables
2. **Check Sender Email**: Verify `RESEND_FROM_EMAIL` is from a verified domain or use `onboarding@resend.dev` for testing
3. **Check Logs**: Look for error messages in server console
4. **Check Resend Dashboard**: View email logs and delivery status
5. **Check User Preferences**: Ensure the user has email notifications enabled

### Emails Going to Spam

1. **Verify Domain**: Make sure your sending domain is fully verified in Resend
2. **Add SPF/DKIM Records**: Complete all DNS verification steps
3. **Check Content**: Avoid spam trigger words in email content
4. **Test First**: Send test emails to yourself before going to production

### Rate Limiting

- Resend free tier: No rate limits within the 3,000/month quota
- If you hit limits: Upgrade to Pro tier or implement queueing

## Database Schema

Email preferences are stored in the `User` model:

```prisma
model User {
  // ... other fields ...

  emailNotifications       Boolean @default(true)
  emailJoinRequests        Boolean @default(true)
  emailJoinApprovals       Boolean @default(true)
  emailMatchUpdates        Boolean @default(true)
  emailGroupInvitations    Boolean @default(true)
}
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Verify user ownership** - Only send emails to verified email addresses
3. **Rate limit user actions** - Prevent abuse of email system
4. **Provide unsubscribe** - All emails link to preference management
5. **Log email sends** - Track delivery for debugging

## Future Enhancements

Potential improvements:
- Email digest (daily/weekly summary)
- Custom email templates per user
- Email verification flow
- Transactional email analytics
- A/B testing email content
- Rich notifications with embedded images

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Status**: https://status.resend.com
- **ForeSum Issues**: https://github.com/your-repo/issues

## Related Files

- `/src/lib/email.ts` - Email service and templates
- `/src/lib/notifications.ts` - Notification service with email integration
- `/src/app/api/profile/email-preferences/route.ts` - API endpoint for preferences
- `/prisma/schema.prisma` - Database schema with email preferences
