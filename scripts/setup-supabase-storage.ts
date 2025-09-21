/**
 * Setup script for Supabase Storage buckets
 * 
 * This script creates the necessary storage buckets for ForeSum app.
 * Run this after setting up your Supabase project and configuring environment variables.
 * 
 * To run: npx tsx scripts/setup-supabase-storage.ts
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\nPlease check your .env.local file and ensure these variables are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names
const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  GOLF_COURSES: 'golf-courses',
  BACKGROUNDS: 'backgrounds',
  LOGOS: 'logos',
  GROUP_ICONS: 'group-icons'
} as const

async function createBucket(name: string, isPublic = true) {
  const { data, error } = await supabase.storage.createBucket(name, {
    public: isPublic,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    fileSizeLimit: 5242880, // 5MB
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ Bucket '${name}' already exists`)
    } else {
      console.error(`❌ Error creating bucket '${name}':`, error.message)
    }
  } else {
    console.log(`🎉 Created bucket '${name}' successfully`)
  }
}

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage buckets for ForeSum...\n')

  // Create all storage buckets
  await createBucket(STORAGE_BUCKETS.AVATARS)
  await createBucket(STORAGE_BUCKETS.GOLF_COURSES)
  await createBucket(STORAGE_BUCKETS.BACKGROUNDS)
  await createBucket(STORAGE_BUCKETS.LOGOS)
  await createBucket(STORAGE_BUCKETS.GROUP_ICONS)

  console.log('\n📋 Storage Setup Complete!')
  console.log('\nNext steps:')
  console.log('1. Update your .env.local with your actual Supabase anon key')
  console.log('2. Configure Row Level Security policies in Supabase Dashboard')
  console.log('3. Test avatar upload functionality')
  
  console.log('\n🔐 Recommended RLS Policies:')
  console.log('- avatars: Users can upload/update/delete their own avatars')
  console.log('- group-icons: Group creators can upload/update/delete their group icons')
  console.log('- golf-courses: Public read, admin write')
  console.log('- backgrounds: Public read, admin write')
  console.log('- logos: Public read, admin write')
}

setupStorage().catch((error) => {
  console.error('Setup failed:', error)
  process.exit(1)
})