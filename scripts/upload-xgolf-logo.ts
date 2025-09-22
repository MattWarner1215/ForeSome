/**
 * Upload X-Golf logo to Supabase Storage
 *
 * This script uploads the X-Golf logo to the logos bucket in Supabase Storage
 *
 * To run: npx tsx scripts/upload-xgolf-logo.ts
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

async function uploadXGolfLogo() {
  console.log('🏌️‍♂️ Starting X-Golf logo upload to Supabase Storage...\n')

  try {
    const logoPath = 'public/images/xgolf-logo.png'
    const remotePath = 'xgolf-logo.png'
    const bucket = 'logos'

    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo file not found at: ${logoPath}`)
    }

    // Read the file
    const fileBuffer = fs.readFileSync(logoPath)
    console.log(`📁 File size: ${fileBuffer.length} bytes`)

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(remotePath, fileBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error(`❌ Error uploading X-Golf logo:`, error.message)
      return false
    }

    console.log(`✅ Successfully uploaded X-Golf logo to ${bucket}/${remotePath}`)

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(remotePath)

    console.log(`🔗 Public URL: ${urlData.publicUrl}`)

    console.log('\n🎉 X-Golf logo upload completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Error uploading X-Golf logo:', error)
    return false
  }
}

uploadXGolfLogo().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})