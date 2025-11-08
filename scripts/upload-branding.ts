import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadBranding() {
  console.log('🎨 Uploading ForeSum Golf branding assets...\n')

  try {
    // Upload logo
    console.log('📤 Uploading logo...')
    const logoPath = '/Users/mwarner/Downloads/foresum-golf-logo.svg'
    const logoFile = readFileSync(logoPath)

    const { data: logoData, error: logoError } = await supabase.storage
      .from('logos')
      .upload('foresum-golf-logo.svg', logoFile, {
        contentType: 'image/svg+xml',
        upsert: true
      })

    if (logoError) {
      console.error('❌ Logo upload error:', logoError)
    } else {
      console.log('✅ Logo uploaded successfully!')
      const { data: { publicUrl: logoUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl('foresum-golf-logo.svg')
      console.log('   URL:', logoUrl)
    }

    console.log('')

    // Upload icon
    console.log('📤 Uploading icon...')
    const iconPath = '/Users/mwarner/Downloads/foresum-golf-icon (1).svg'
    const iconFile = readFileSync(iconPath)

    const { data: iconData, error: iconError } = await supabase.storage
      .from('logos')
      .upload('foresum-golf-icon.svg', iconFile, {
        contentType: 'image/svg+xml',
        upsert: true
      })

    if (iconError) {
      console.error('❌ Icon upload error:', iconError)
    } else {
      console.log('✅ Icon uploaded successfully!')
      const { data: { publicUrl: iconUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl('foresum-golf-icon.svg')
      console.log('   URL:', iconUrl)
    }

    console.log('\n🎉 Branding assets uploaded to Supabase Storage!')
    console.log('📁 Bucket: logos')
    console.log('📂 Files:')
    console.log('   - foresum-golf-logo.svg')
    console.log('   - foresum-golf-icon.svg')

  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

uploadBranding()
