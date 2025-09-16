import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({
        message: 'Token and password are required'
      }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({
        message: 'Password must be at least 6 characters long'
      }, { status: 400 })
    }

    // Find and validate the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expires: true,
        used: true
      }
    })

    if (!resetToken) {
      return NextResponse.json({
        message: 'Invalid or expired reset token'
      }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({
        message: 'Reset token has already been used'
      }, { status: 400 })
    }

    if (new Date() > resetToken.expires) {
      return NextResponse.json({
        message: 'Reset token has expired'
      }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({
        message: 'User not found'
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({
      message: 'Password has been reset successfully'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// GET /api/auth/reset-password - Validate reset token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        message: 'Token is required'
      }, { status: 400 })
    }

    // Find and validate the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expires: true,
        used: true
      }
    })

    if (!resetToken) {
      return NextResponse.json({
        message: 'Invalid reset token',
        valid: false
      }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({
        message: 'Reset token has already been used',
        valid: false
      }, { status: 400 })
    }

    if (new Date() > resetToken.expires) {
      return NextResponse.json({
        message: 'Reset token has expired',
        valid: false
      }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Token is valid',
      valid: true,
      email: resetToken.email
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({
      message: 'Internal server error',
      valid: false
    }, { status: 500 })
  }
}