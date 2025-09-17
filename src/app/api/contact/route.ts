import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const contactSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Get client information
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Save to database
    const registration = await prisma.emailRegistration.upsert({
      where: {
        email: validatedData.email
      },
      update: {
        updatedAt: new Date(),
        ipAddress,
        userAgent
      },
      create: {
        email: validatedData.email,
        source: 'coming_soon',
        ipAddress,
        userAgent
      }
    })

    // Optional: Send notification email to you
    // You can uncomment and configure this section when you set up email service
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter({
      // Configure your email service here
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: 'noreply@foresum.com',
      to: 'mattwarner76@gmail.com',
      subject: 'New ForeSum Email Signup',
      html: `
        <h3>New Email Registration</h3>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Source:</strong> Coming Soon Page</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `
    });
    */

    // Log for development
    console.log('New email registration:', {
      email: validatedData.email,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'Email registered successfully',
      id: registration.id
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Handle duplicate email (if trying to insert again)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 } // Return success for UX, but don't create duplicate
      )
    }

    console.error('Email registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register email' },
      { status: 500 }
    )
  }
}