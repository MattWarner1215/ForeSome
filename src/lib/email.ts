import { Resend } from 'resend'

// Lazy-initialize Resend client
let resend: Resend | null = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * Send an email using Resend
   */
  static async sendEmail({ to, subject, html, text }: SendEmailOptions) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured. Skipping email send.')
        return null
      }

      if (!process.env.RESEND_FROM_EMAIL) {
        console.warn('RESEND_FROM_EMAIL not configured. Skipping email send.')
        return null
      }

      const client = getResendClient()
      if (!client) {
        console.warn('Failed to initialize Resend client. Skipping email send.')
        return null
      }

      const data = await client.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || undefined,
      })

      console.log('Email sent successfully:', data)
      return data
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  }

  /**
   * Send join request notification email
   */
  static async sendJoinRequestEmail(
    recipientEmail: string,
    recipientName: string,
    requesterName: string,
    matchTitle: string,
    matchDate: string,
    matchTime: string,
    matchId: string
  ) {
    const subject = `New Join Request for "${matchTitle}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button:hover { background: #047857; }
            .match-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏌️ ForeSum</h1>
              <p>New Join Request</p>
            </div>
            <div class="content">
              <h2>Hi ${recipientName}!</h2>
              <p><strong>${requesterName}</strong> wants to join your golf round:</p>

              <div class="match-details">
                <h3>📅 ${matchTitle}</h3>
                <p><strong>Date:</strong> ${matchDate}</p>
                <p><strong>Time:</strong> ${matchTime}</p>
              </div>

              <p>Review this request and approve or decline:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}/manage" class="button">
                  Manage Join Requests
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                You can also manage this request from your dashboard at any time.
              </p>
            </div>
            <div class="footer">
              <p>ForeSum - Connect with golfers and enjoy the game</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #059669;">Manage Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  }

  /**
   * Send join approval notification email
   */
  static async sendJoinApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    matchTitle: string,
    matchDate: string,
    matchTime: string,
    courseName: string,
    matchId: string
  ) {
    const subject = `Your request to join "${matchTitle}" was approved! 🎉`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button:hover { background: #047857; }
            .match-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏌️ ForeSum</h1>
              <p>Request Approved!</p>
            </div>
            <div class="content">
              <h2>Great news, ${recipientName}! 🎉</h2>
              <p>Your request to join <strong>${matchTitle}</strong> has been approved!</p>

              <div class="match-details">
                <h3>📅 ${matchTitle}</h3>
                <p><strong>Course:</strong> ${courseName}</p>
                <p><strong>Date:</strong> ${matchDate}</p>
                <p><strong>Time:</strong> ${matchTime}</p>
              </div>

              <p>Get ready to hit the greens! View the full match details and chat with other players:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}" class="button">
                  View Match Details
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                See you on the course! ⛳
              </p>
            </div>
            <div class="footer">
              <p>ForeSum - Connect with golfers and enjoy the game</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #059669;">Manage Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  }

  /**
   * Send join declined notification email
   */
  static async sendJoinDeclinedEmail(
    recipientEmail: string,
    recipientName: string,
    matchTitle: string,
    reason?: string
  ) {
    const subject = `Update on your request to join "${matchTitle}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button:hover { background: #047857; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏌️ ForeSum</h1>
              <p>Request Update</p>
            </div>
            <div class="content">
              <h2>Hi ${recipientName},</h2>
              <p>Unfortunately, your request to join <strong>${matchTitle}</strong> was declined.</p>

              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

              <p>Don't worry! There are plenty of other rounds waiting for you:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/rounds" class="button">
                  Browse Public Rounds
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Keep swinging! ⛳
              </p>
            </div>
            <div class="footer">
              <p>ForeSum - Connect with golfers and enjoy the game</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #059669;">Manage Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  }

  /**
   * Send group invitation email
   */
  static async sendGroupInvitationEmail(
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    groupName: string,
    groupId: string
  ) {
    const subject = `You've been invited to join "${groupName}" on ForeSum`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button:hover { background: #6d28d9; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏌️ ForeSum</h1>
              <p>Group Invitation</p>
            </div>
            <div class="content">
              <h2>Hi ${recipientName}!</h2>
              <p><strong>${inviterName}</strong> has invited you to join their golf group:</p>

              <h3 style="color: #7c3aed; margin: 20px 0;">👥 ${groupName}</h3>

              <p>Join this group to play private rounds and connect with fellow golfers!</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/groups" class="button">
                  View Invitation
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                You can accept or decline this invitation from your Groups page.
              </p>
            </div>
            <div class="footer">
              <p>ForeSum - Connect with golfers and enjoy the game</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #7c3aed;">Manage Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  }

  /**
   * Send match update email
   */
  static async sendMatchUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    matchTitle: string,
    updateMessage: string,
    matchId: string
  ) {
    const subject = `Update: "${matchTitle}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button:hover { background: #1d4ed8; }
            .update-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏌️ ForeSum</h1>
              <p>Match Update</p>
            </div>
            <div class="content">
              <h2>Hi ${recipientName}!</h2>
              <p>There's an update to your golf round:</p>

              <div class="update-box">
                <h3>📅 ${matchTitle}</h3>
                <p>${updateMessage}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}" class="button">
                  View Match Details
                </a>
              </div>
            </div>
            <div class="footer">
              <p>ForeSum - Connect with golfers and enjoy the game</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #2563eb;">Manage Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
  }
}
