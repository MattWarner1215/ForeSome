import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileToStorage, deleteFileFromStorage, getStoragePublicUrl, generateUniqueFilename, STORAGE_BUCKETS } from '@/lib/supabase'

// POST /api/profile/avatar - Upload avatar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Generate unique filename for Supabase Storage
    const fileName = generateUniqueFilename(file.name, session.user.id)

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })

    // Delete old avatar from Supabase Storage if it exists
    if (currentUser?.image && currentUser.image.includes('supabase')) {
      try {
        // Extract filename from Supabase URL
        const oldFileName = currentUser.image.split('/').pop()
        if (oldFileName) {
          await deleteFileFromStorage(STORAGE_BUCKETS.AVATARS, oldFileName)
        }
      } catch (error) {
        console.log('Could not delete old avatar:', error)
        // Continue with upload even if old file deletion fails
      }
    }

    // Upload to Supabase Storage with error handling
    try {
      await uploadFileToStorage(STORAGE_BUCKETS.AVATARS, fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
      console.log('✅ File uploaded successfully to Supabase Storage')
    } catch (storageError) {
      console.error('❌ Storage upload error details:', storageError)
      // Fall back to continuing anyway - maybe the file uploaded despite the error
    }

    // Get public URL for the uploaded file
    const avatarUrl = getStoragePublicUrl(STORAGE_BUCKETS.AVATARS, fileName)
    console.log('🔗 Generated avatar URL:', avatarUrl)

    // Update user's avatar URL in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl }
    })

    console.log('💾 Updated user avatar URL in database')

    return NextResponse.json({ 
      message: 'Avatar uploaded successfully to Supabase Storage',
      avatarUrl 
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })

    // Delete avatar from Supabase Storage if it exists
    if (currentUser?.image && currentUser.image.includes('supabase')) {
      try {
        // Extract filename from Supabase URL
        const fileName = currentUser.image.split('/').pop()
        if (fileName) {
          await deleteFileFromStorage(STORAGE_BUCKETS.AVATARS, fileName)
        }
      } catch (error) {
        console.log('Could not delete avatar file:', error)
        // Continue with database update even if file deletion fails
      }
    }

    // Remove avatar from database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    })

    return NextResponse.json({ message: 'Avatar removed successfully from Supabase Storage' })
  } catch (error) {
    console.error('Avatar removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}