/**
 * Upload existing images to Supabase Storage buckets
 *
 * This script uploads all local images to their appropriate Supabase buckets
 * and organizes them by category.
 *
 * To run: npx tsx scripts/upload-images-to-supabase.ts
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Storage bucket names
const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  GOLF_COURSES: 'golf-courses',
  BACKGROUNDS: 'backgrounds',
  LOGOS: 'logos',
  GROUP_ICONS: 'group-icons'
} as const

// Image categorization
const imageCategories = {
  logos: [
    'foresum_logo.png',
    'forsome_logo.png'
  ],
  backgrounds: [
    'golf_Back_groups.jpg',
    'golf-course-bg.jpg',
    'golf_manage_back.jpg',
    'golf_back_profile.jpeg',
    'clubs_back.jpg',
    'golf_public_background.jpg'
  ],
  icons: [
    'myGroups_icon.png',
    'create_Icon.png',
    'myRoundsNew_icon.png',
    'MYRounds_Icon.png',
    'topGolfer_Icon.png',
    'calendar_icon.png',
    'owner_icon.png',
    'member_icon.png'
  ],
  avatars: [
    // Files in uploads/avatars/ directory
  ]
}

async function uploadFile(bucket: string, localPath: string, remotePath: string) {
  try {
    const fileBuffer = fs.readFileSync(localPath)
    const fileExtension = path.extname(localPath).toLowerCase()

    let contentType = 'image/jpeg'
    if (fileExtension === '.png') contentType = 'image/png'
    else if (fileExtension === '.gif') contentType = 'image/gif'
    else if (fileExtension === '.webp') contentType = 'image/webp'
    else if (fileExtension === '.svg') contentType = 'image/svg+xml'

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(remotePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error(`❌ Error uploading ${remotePath}:`, error.message)
      return false
    }

    console.log(`✅ Uploaded ${remotePath} to ${bucket}`)
    return true
  } catch (error) {
    console.error(`❌ Error reading file ${localPath}:`, error)
    return false
  }
}

async function uploadImagesByCategory() {
  console.log('🚀 Uploading images to Supabase Storage...\n')

  let totalUploaded = 0
  let totalFailed = 0

  // Upload logos
  console.log('📁 Uploading logos...')
  for (const filename of imageCategories.logos) {
    const localPath = path.join('public/images', filename)
    if (fs.existsSync(localPath)) {
      const success = await uploadFile(STORAGE_BUCKETS.LOGOS, localPath, filename)
      if (success) totalUploaded++
      else totalFailed++
    }
  }

  // Upload backgrounds
  console.log('\n📁 Uploading backgrounds...')
  for (const filename of imageCategories.backgrounds) {
    const localPath = path.join('public/images', filename)
    if (fs.existsSync(localPath)) {
      const success = await uploadFile(STORAGE_BUCKETS.BACKGROUNDS, localPath, filename)
      if (success) totalUploaded++
      else totalFailed++
    }
  }

  // Upload icons (to group-icons bucket for now)
  console.log('\n📁 Uploading icons...')
  for (const filename of imageCategories.icons) {
    const localPath = path.join('public/images', filename)
    if (fs.existsSync(localPath)) {
      const success = await uploadFile(STORAGE_BUCKETS.GROUP_ICONS, localPath, filename)
      if (success) totalUploaded++
      else totalFailed++
    }
  }

  // Upload existing avatars
  console.log('\n📁 Uploading existing avatars...')
  const avatarsDir = 'public/uploads/avatars'
  if (fs.existsSync(avatarsDir)) {
    const avatarFiles = fs.readdirSync(avatarsDir)
    for (const filename of avatarFiles) {
      if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const localPath = path.join(avatarsDir, filename)
        const success = await uploadFile(STORAGE_BUCKETS.AVATARS, localPath, filename)
        if (success) totalUploaded++
        else totalFailed++
      }
    }
  }

  // Upload other images in public root
  console.log('\n📁 Uploading other images...')
  const publicFiles = fs.readdirSync('public')
  for (const filename of publicFiles) {
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const localPath = path.join('public', filename)
      // Categorize based on filename
      let bucket = STORAGE_BUCKETS.BACKGROUNDS // default
      if (filename.toLowerCase().includes('logo')) {
        bucket = STORAGE_BUCKETS.LOGOS
      }
      const success = await uploadFile(bucket, localPath, filename)
      if (success) totalUploaded++
      else totalFailed++
    }
  }

  console.log('\n📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${totalUploaded} files`)
  console.log(`❌ Failed uploads: ${totalFailed} files`)

  if (totalUploaded > 0) {
    console.log('\n🎉 Images have been uploaded to Supabase Storage!')
    console.log('\nNext steps:')
    console.log('1. Update your app to use Supabase URLs instead of local paths')
    console.log('2. Remove local image files if desired (keep backups!)')
    console.log('3. Test image loading in your application')
  }
}

uploadImagesByCategory().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})