import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        message: 'Email is required'
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true }
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate secure random token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Clean up any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    })

    // Create new password reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires
      }
    })

    // In a real application, you would send an email here
    // For development, we'll log the reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
    console.log('Password reset link:', resetLink)

    // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
    // await sendPasswordResetEmail(user.email, user.name, resetLink)

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Include reset link in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json({
      message: 'Internal server error'
    }, { status: 500 })
  }
}