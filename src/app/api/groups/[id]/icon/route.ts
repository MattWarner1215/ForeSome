import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Verify user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true, icon: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can upload icons' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('icon') as File

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large. Please upload an image smaller than 5MB.'
      }, { status: 400 })
    }

    // Delete old icon if it exists
    if (group.icon) {
      try {
        // Extract file path from URL - handles both old and new formats
        let filePath = ''

        if (group.icon.includes('/storage/v1/object/public/group-icons/')) {
          // Extract everything after the bucket name
          const parts = group.icon.split('/storage/v1/object/public/group-icons/')
          filePath = parts[1] || ''
        } else {
          // Fallback: assume it's just a filename
          const urlParts = group.icon.split('/')
          filePath = urlParts[urlParts.length - 1]
        }

        if (filePath) {
          await supabaseAdmin.storage
            .from('group-icons')
            .remove([filePath])
        }
      } catch (error) {
        console.error('Error deleting old group icon:', error)
        // Continue with upload even if deletion fails
      }
    }

    // Generate unique filename with user ID for RLS compatibility
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${session.user.id}/${groupId}-${Date.now()}.${fileExtension}`

    // Convert file to buffer
    let buffer: Uint8Array
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = new Uint8Array(arrayBuffer)

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Invalid file content' }, { status: 400 })
      }
    } catch (error) {
      console.error('Error processing file:', error)
      return NextResponse.json({ error: 'Failed to process file' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('group-icons')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload icon'
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('group-icons')
      .getPublicUrl(fileName)

    const iconUrl = urlData.publicUrl

    // Update group with new icon URL
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { icon: iconUrl },
      select: {
        id: true,
        name: true,
        icon: true
      }
    })

    return NextResponse.json({
      message: 'Group icon uploaded successfully',
      group: updatedGroup,
      iconUrl
    })

  } catch (error) {
    console.error('Group icon upload error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Verify user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true, icon: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can delete icons' }, { status: 403 })
    }

    if (!group.icon) {
      return NextResponse.json({ error: 'No icon to delete' }, { status: 400 })
    }

    // Delete from Supabase Storage
    try {
      // Extract file path from URL - handles both old and new formats
      let filePath = ''

      if (group.icon.includes('/storage/v1/object/public/group-icons/')) {
        // Extract everything after the bucket name
        const parts = group.icon.split('/storage/v1/object/public/group-icons/')
        filePath = parts[1] || ''
      } else {
        // Fallback: assume it's just a filename
        const urlParts = group.icon.split('/')
        filePath = urlParts[urlParts.length - 1]
      }

      if (filePath) {
        await supabaseAdmin.storage
          .from('group-icons')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Error deleting group icon from storage:', error)
      // Continue with database update even if storage deletion fails
    }

    // Update group to remove icon URL
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { icon: null },
      select: {
        id: true,
        name: true,
        icon: true
      }
    })

    return NextResponse.json({
      message: 'Group icon deleted successfully',
      group: updatedGroup
    })

  } catch (error) {
    console.error('Group icon deletion error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}