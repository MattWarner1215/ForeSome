/**
 * Migration script to upload existing local images to Supabase Storage
 * 
 * This script uploads all existing images from the public directory to their
 * appropriate Supabase Storage buckets.
 * 
 * To run: npx tsx scripts/migrate-images-to-supabase.ts
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket configuration
const BUCKET_MAPPINGS = {
  'backgrounds': {
    bucket: 'backgrounds',
    paths: [
      'public/images/golf_public_background.jpg',
      'public/images/golf_Back_groups.jpg',
      'public/images/clubs_back.jpg',
      'public/images/golf_manage_back.jpg'
    ]
  },
  'logos': {
    bucket: 'logos',
    paths: [
      'public/images/foresum_logo.png',
      'public/logos'
    ]
  }
} as const

// MIME type mapping
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  }
  return mimeTypes[ext] || 'image/jpeg'
}

async function uploadFile(bucket: string, localPath: string, remotePath: string) {
  try {
    if (!existsSync(localPath)) {
      console.log(`⚠️  File not found: ${localPath}`)
      return false
    }

    const fileBuffer = await fs.readFile(localPath)
    const mimeType = getMimeType(localPath)
    const file = new File([new Uint8Array(fileBuffer)], path.basename(localPath), { type: mimeType })
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(remotePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType
      })
    
    if (error) {
      console.error(`❌ Error uploading ${localPath}:`, error.message)
      return false
    }
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(remotePath)
    console.log(`✅ Uploaded: ${localPath} → ${urlData.publicUrl}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error)
    return false
  }
}

async function uploadDirectory(bucket: string, dirPath: string) {
  try {
    if (!existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`)
      return 0
    }

    const files = await fs.readdir(dirPath)
    let uploadCount = 0
    
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stat = await fs.stat(filePath)
      
      if (stat.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
        const success = await uploadFile(bucket, filePath, file)
        if (success) uploadCount++
      }
    }
    
    return uploadCount
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error)
    return 0
  }
}

async function createImageUrlMapping() {
  const mapping = {
    backgrounds: {} as Record<string, string>,
    logos: {} as Record<string, string>
  }

  // Generate mappings for each bucket
  for (const [category, config] of Object.entries(BUCKET_MAPPINGS)) {
    for (const localPath of config.paths) {
      if (localPath.endsWith('/')) continue // Skip directory paths
      
      const fileName = path.basename(localPath)
      const { data } = supabase.storage.from(config.bucket).getPublicUrl(fileName)
      
      // Create mapping from old path to new URL
      const oldUrl = localPath.replace('public', '')
      mapping[category as keyof typeof mapping][oldUrl] = data.publicUrl
    }
  }

  // Write mapping to file for easy reference
  const mappingPath = path.join(process.cwd(), 'image-url-mapping.json')
  await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2))
  console.log(`📝 Image URL mapping saved to: ${mappingPath}`)
  
  return mapping
}

async function migrateImages() {
  console.log('🚀 Starting image migration to Supabase Storage...\n')
  
  let totalUploaded = 0
  
  // Upload background images
  console.log('📂 Uploading background images...')
  for (const imagePath of BUCKET_MAPPINGS.backgrounds.paths) {
    if (existsSync(imagePath)) {
      const fileName = path.basename(imagePath)
      const success = await uploadFile('backgrounds', imagePath, fileName)
      if (success) totalUploaded++
    }
  }
  
  // Upload logo files
  console.log('\n📂 Uploading logo files...')
  if (existsSync('public/logos')) {
    const logoCount = await uploadDirectory('logos', 'public/logos')
    totalUploaded += logoCount
  }
  
  // Upload main logo
  if (existsSync('public/images/foresum_logo.png')) {
    const success = await uploadFile('logos', 'public/images/foresum_logo.png', 'foresum_logo.png')
    if (success) totalUploaded++
  }
  
  console.log(`\n🎉 Migration complete! Uploaded ${totalUploaded} images`)
  
  // Create URL mapping
  console.log('\n📋 Creating URL mappings...')
  await createImageUrlMapping()
  
  console.log('\n✅ Next steps:')
  console.log('1. Update your app components to use the new Supabase URLs')
  console.log('2. Test that all images load correctly')
  console.log('3. Remove local image files from Git LFS (optional)')
  console.log('4. Check the generated image-url-mapping.json for URL mappings')
}

migrateImages().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})