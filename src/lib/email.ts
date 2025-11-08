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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 20px;
            }
            .email-wrapper { max-width: 600px; margin: 0 auto; }
            .email-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 32px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: pulse 3s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .brand-icon {
              display: inline-block;
              width: 48px;
              height: 48px;
              background: rgba(255,255,255,0.2);
              border-radius: 12px;
              line-height: 48px;
              font-size: 24px;
              margin-bottom: 12px;
              backdrop-filter: blur(10px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 6px;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 13px;
              opacity: 0.9;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .greeting {
              font-size: 26px;
              color: #0f172a;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .greeting i {
              color: #10b981;
              margin-right: 8px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 25px;
            }
            .message strong {
              color: #10b981;
              font-weight: 600;
            }
            .match-card {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 5px solid #10b981;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            }
            .match-card h3 {
              color: #059669;
              font-size: 20px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .detail-row {
              display: flex;
              align-items: center;
              margin: 10px 0;
              color: #374151;
              font-size: 15px;
            }
            .detail-row i {
              color: #10b981;
              width: 24px;
              margin-right: 10px;
            }
            .detail-row strong {
              margin-right: 8px;
              min-width: 50px;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
            }
            .button i {
              margin-right: 8px;
            }
            .note {
              color: #6b7280;
              font-size: 14px;
              text-align: center;
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              padding: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 8px 0;
            }
            .footer a {
              color: #10b981;
              text-decoration: none;
              font-weight: 500;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <div class="brand-icon">
                    <i class="fas fa-golf-ball-tee"></i>
                  </div>
                  <h1>ForeSum Golf</h1>
                  <p>New Join Request</p>
                </div>
              </div>
              <div class="content">
                <div class="greeting"><i class="fas fa-hand-wave"></i> Hi ${recipientName}!</div>
                <div class="message">
                  <i class="fas fa-user-circle" style="color: #10b981; margin-right: 6px;"></i><strong>${requesterName}</strong> wants to join your golf round and is waiting for your approval!
                </div>

                <div class="match-card">
                  <h3><i class="fas fa-flag-checkered"></i> ${matchTitle}</h3>
                  <div class="detail-row">
                    <i class="fas fa-calendar-alt"></i>
                    <strong>Date:</strong> ${matchDate}
                  </div>
                  <div class="detail-row">
                    <i class="fas fa-clock"></i>
                    <strong>Time:</strong> ${matchTime}
                  </div>
                  <div class="detail-row">
                    <i class="fas fa-user"></i>
                    <strong>Player:</strong> ${requesterName}
                  </div>
                </div>

                <div class="divider"></div>

                <div class="cta-container">
                  <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}/manage" class="button">
                    <i class="fas fa-tasks"></i> Review Request
                  </a>
                </div>

                <div class="note">
                  <i class="fas fa-info-circle"></i> You can approve or decline this request from your dashboard at any time.
                </div>
              </div>
              <div class="footer">
                <p><i class="fas fa-golf-ball-tee" style="color: #10b981;"></i> <strong>ForeSum Golf</strong> - Connect with golfers and enjoy the game</p>
                <p>
                  <a href="${process.env.NEXTAUTH_URL}/profile"><i class="fas fa-cog"></i> Manage Email Preferences</a>
                </p>
              </div>
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
    const subject = `You're In! Request Approved for "${matchTitle}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 20px;
            }
            .email-wrapper { max-width: 600px; margin: 0 auto; }
            .email-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 32px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: pulse 3s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .brand-icon {
              display: inline-block;
              width: 48px;
              height: 48px;
              background: rgba(255,255,255,0.2);
              border-radius: 12px;
              line-height: 48px;
              font-size: 24px;
              margin-bottom: 12px;
              backdrop-filter: blur(10px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 6px;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 13px;
              opacity: 0.9;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .success-badge {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 15px 25px;
              border-radius: 50px;
              display: inline-block;
              margin-bottom: 25px;
              font-size: 18px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .success-badge i {
              margin-right: 8px;
            }
            .greeting {
              font-size: 26px;
              color: #0f172a;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .greeting i {
              color: #10b981;
              margin-right: 8px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 25px;
            }
            .message strong {
              color: #10b981;
              font-weight: 600;
            }
            .match-card {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 5px solid #10b981;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            }
            .match-card h3 {
              color: #059669;
              font-size: 20px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .detail-row {
              display: flex;
              align-items: center;
              margin: 10px 0;
              color: #374151;
              font-size: 15px;
            }
            .detail-row i {
              color: #10b981;
              width: 24px;
              margin-right: 10px;
            }
            .detail-row strong {
              margin-right: 8px;
              min-width: 60px;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
            }
            .button i {
              margin-right: 8px;
            }
            .excitement-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #fbbf24;
              padding: 20px;
              border-radius: 12px;
              margin: 25px 0;
              text-align: center;
            }
            .excitement-box i {
              font-size: 32px;
              color: #f59e0b;
              margin-bottom: 10px;
            }
            .excitement-box p {
              color: #92400e;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              padding: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 8px 0;
            }
            .footer a {
              color: #10b981;
              text-decoration: none;
              font-weight: 500;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <div class="brand-icon">
                    <i class="fas fa-golf-ball-tee"></i>
                  </div>
                  <h1>ForeSum Golf</h1>
                  <p>Request Approved!</p>
                </div>
              </div>
              <div class="content">
                <div style="text-align: center;">
                  <div class="success-badge">
                    <i class="fas fa-party-horn"></i> You're In!
                  </div>
                </div>

                <div class="greeting"><i class="fas fa-party-horn"></i> Great news, ${recipientName}!</div>
                <div class="message">
                  <i class="fas fa-circle-check" style="color: #10b981; margin-right: 6px;"></i>Your request to join <strong>${matchTitle}</strong> has been approved! Time to dust off those clubs!
                </div>

                <div class="match-card">
                  <h3><i class="fas fa-flag-checkered"></i> ${matchTitle}</h3>
                  <div class="detail-row">
                    <i class="fas fa-golf-ball-tee"></i>
                    <strong>Course:</strong> ${courseName}
                  </div>
                  <div class="detail-row">
                    <i class="fas fa-calendar-alt"></i>
                    <strong>Date:</strong> ${matchDate}
                  </div>
                  <div class="detail-row">
                    <i class="fas fa-clock"></i>
                    <strong>Time:</strong> ${matchTime}
                  </div>
                </div>

                <div class="excitement-box">
                  <i class="fas fa-trophy"></i>
                  <p>See you on the greens!</p>
                </div>

                <div class="divider"></div>

                <div class="cta-container">
                  <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}" class="button">
                    <i class="fas fa-eye"></i> View Match Details
                  </a>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-comments"></i> Chat with your group and plan your round!
                  </p>
                </div>
              </div>
              <div class="footer">
                <p><i class="fas fa-golf-ball-tee" style="color: #10b981;"></i> <strong>ForeSum Golf</strong> - Connect with golfers and enjoy the game</p>
                <p>
                  <a href="${process.env.NEXTAUTH_URL}/profile"><i class="fas fa-cog"></i> Manage Email Preferences</a>
                </p>
              </div>
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
    const subject = `Update on "${matchTitle}" Request`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 20px;
            }
            .email-wrapper { max-width: 600px; margin: 0 auto; }
            .email-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
              color: white;
              padding: 24px 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 4px;
              font-weight: 700;
            }
            .header p {
              font-size: 14px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .greeting {
              font-size: 26px;
              color: #0f172a;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .greeting i {
              color: #10b981;
              margin-right: 8px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 25px;
            }
            .message strong {
              color: #374151;
              font-weight: 600;
            }
            .reason-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 5px solid #f59e0b;
              padding: 20px;
              border-radius: 12px;
              margin: 25px 0;
            }
            .reason-box i {
              color: #f59e0b;
              margin-right: 10px;
            }
            .reason-box p {
              color: #92400e;
              font-weight: 500;
            }
            .encouragement-box {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              text-align: center;
            }
            .encouragement-box i {
              font-size: 32px;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .encouragement-box h3 {
              color: #1e40af;
              margin-bottom: 10px;
            }
            .encouragement-box p {
              color: #1e3a8a;
              font-weight: 500;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
            }
            .button i {
              margin-right: 8px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              padding: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 8px 0;
            }
            .footer a {
              color: #10b981;
              text-decoration: none;
              font-weight: 500;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <div class="brand-icon">
                    <i class="fas fa-golf-ball-tee"></i>
                  </div>
                  <h1>ForeSum Golf</h1>
                  <p>Request Update</p>
                </div>
              </div>
              <div class="content">
                <div class="greeting"><i class="fas fa-hand-wave"></i> Hi ${recipientName},</div>
                <div class="message">
                  <i class="fas fa-info-circle" style="color: #6b7280; margin-right: 6px;"></i>Your request to join <strong>${matchTitle}</strong> was not approved this time.
                </div>

                ${reason ? `
                <div class="reason-box">
                  <p><i class="fas fa-comment-dots"></i><strong>Note:</strong> ${reason}</p>
                </div>
                ` : ''}

                <div class="encouragement-box">
                  <i class="fas fa-heart"></i>
                  <h3>Don't let this slow you down!</h3>
                  <p>There are plenty of other golfers looking for partners just like you.</p>
                </div>

                <div class="divider"></div>

                <div class="cta-container">
                  <a href="${process.env.NEXTAUTH_URL}/rounds" class="button">
                    <i class="fas fa-search"></i> Browse Available Rounds
                  </a>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-golf-ball"></i> Keep swinging! Your perfect match is out there
                  </p>
                </div>
              </div>
              <div class="footer">
                <p><i class="fas fa-golf-ball-tee" style="color: #10b981;"></i> <strong>ForeSum Golf</strong> - Connect with golfers and enjoy the game</p>
                <p>
                  <a href="${process.env.NEXTAUTH_URL}/profile"><i class="fas fa-cog"></i> Manage Email Preferences</a>
                </p>
              </div>
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
    _groupId: string
  ) {
    const subject = `You're Invited to Join "${groupName}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 20px;
            }
            .email-wrapper { max-width: 600px; margin: 0 auto; }
            .email-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
              color: white;
              padding: 24px 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 4px;
              font-weight: 700;
            }
            .header p {
              font-size: 14px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .greeting {
              font-size: 26px;
              color: #0f172a;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .greeting i {
              color: #10b981;
              margin-right: 8px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 25px;
            }
            .message strong {
              color: #7c3aed;
              font-weight: 600;
            }
            .group-card {
              background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
              padding: 30px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 5px solid #7c3aed;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              text-align: center;
            }
            .group-icon {
              font-size: 48px;
              color: #7c3aed;
              margin-bottom: 15px;
            }
            .group-card h3 {
              color: #6d28d9;
              font-size: 22px;
              margin-bottom: 10px;
            }
            .group-card p {
              color: #6b21a8;
              font-size: 14px;
            }
            .benefits {
              background: #f9fafb;
              padding: 20px;
              border-radius: 12px;
              margin: 25px 0;
            }
            .benefit-item {
              display: flex;
              align-items: center;
              margin: 12px 0;
              color: #374151;
            }
            .benefit-item i {
              color: #7c3aed;
              width: 24px;
              margin-right: 12px;
              font-size: 18px;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
              color: white !important;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
            }
            .button i {
              margin-right: 8px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              padding: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 8px 0;
            }
            .footer a {
              color: #7c3aed;
              text-decoration: none;
              font-weight: 500;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <div class="brand-icon">
                    <i class="fas fa-golf-ball-tee"></i>
                  </div>
                  <h1>ForeSum Golf</h1>
                  <p>Group Invitation</p>
                </div>
              </div>
              <div class="content">
                <div class="greeting"><i class="fas fa-hand-wave"></i> Hi ${recipientName}!</div>
                <div class="message">
                  <i class="fas fa-user-plus" style="color: #7c3aed; margin-right: 6px;"></i><strong>${inviterName}</strong> thinks you'd be a great fit for their golf group!
                </div>

                <div class="group-card">
                  <div class="group-icon">
                    <i class="fas fa-user-friends"></i>
                  </div>
                  <h3>${groupName}</h3>
                  <p>Join this exclusive group and tee off with like-minded golfers</p>
                </div>

                <div class="benefits">
                  <div class="benefit-item">
                    <i class="fas fa-calendar-check"></i>
                    <span>Organize private rounds with group members</span>
                  </div>
                  <div class="benefit-item">
                    <i class="fas fa-handshake"></i>
                    <span>Build lasting connections with fellow golfers</span>
                  </div>
                  <div class="benefit-item">
                    <i class="fas fa-trophy"></i>
                    <span>Compete in group tournaments and events</span>
                  </div>
                  <div class="benefit-item">
                    <i class="fas fa-comments"></i>
                    <span>Stay connected through group chat</span>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="cta-container">
                  <a href="${process.env.NEXTAUTH_URL}/groups" class="button">
                    <i class="fas fa-user-check"></i> View Invitation
                  </a>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-info-circle"></i> You can accept or decline from your Groups page
                  </p>
                </div>
              </div>
              <div class="footer">
                <p><i class="fas fa-golf-ball-tee" style="color: #10b981;"></i> <strong>ForeSum Golf</strong> - Connect with golfers and enjoy the game</p>
                <p>
                  <a href="${process.env.NEXTAUTH_URL}/profile"><i class="fas fa-cog"></i> Manage Email Preferences</a>
                </p>
              </div>
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
    const subject = `Match Update: "${matchTitle}"`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 20px;
            }
            .email-wrapper { max-width: 600px; margin: 0 auto; }
            .email-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
              color: white;
              padding: 24px 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 4px;
              font-weight: 700;
            }
            .header p {
              font-size: 14px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .greeting {
              font-size: 26px;
              color: #0f172a;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .greeting i {
              color: #10b981;
              margin-right: 8px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 25px;
            }
            .update-card {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 5px solid #2563eb;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            }
            .update-card h3 {
              color: #1e40af;
              font-size: 20px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .update-content {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .update-content p {
              color: #374151;
              font-size: 15px;
              line-height: 1.6;
            }
            .alert-badge {
              display: inline-block;
              background: #fbbf24;
              color: #92400e;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 15px;
            }
            .alert-badge i {
              margin-right: 6px;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white !important;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
            }
            .button i {
              margin-right: 8px;
            }
            .footer {
              background: #f9fafb;
              text-align: center;
              padding: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280;
              font-size: 14px;
              margin: 8px 0;
            }
            .footer a {
              color: #2563eb;
              text-decoration: none;
              font-weight: 500;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <div class="brand-icon">
                    <i class="fas fa-golf-ball-tee"></i>
                  </div>
                  <h1>ForeSum Golf</h1>
                  <p>Match Update</p>
                </div>
              </div>
              <div class="content">
                <div class="greeting"><i class="fas fa-hand-wave"></i> Hi ${recipientName}!</div>
                <div class="message">
                  <i class="fas fa-bell" style="color: #2563eb; margin-right: 6px;"></i>There's been an update to your upcoming golf round:
                </div>

                <div class="update-card">
                  <div class="alert-badge">
                    <i class="fas fa-exclamation-circle"></i> Important Update
                  </div>
                  <h3><i class="fas fa-flag-checkered"></i> ${matchTitle}</h3>
                  <div class="update-content">
                    <p><i class="fas fa-info-circle" style="color: #2563eb; margin-right: 8px;"></i> ${updateMessage}</p>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="cta-container">
                  <a href="${process.env.NEXTAUTH_URL}/matches/${matchId}" class="button">
                    <i class="fas fa-eye"></i> View Full Details
                  </a>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-comments"></i> Questions? Chat with your group in the match details
                  </p>
                </div>
              </div>
              <div class="footer">
                <p><i class="fas fa-golf-ball-tee" style="color: #10b981;"></i> <strong>ForeSum Golf</strong> - Connect with golfers and enjoy the game</p>
                <p>
                  <a href="${process.env.NEXTAUTH_URL}/profile"><i class="fas fa-cog"></i> Manage Email Preferences</a>
                </p>
              </div>
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
