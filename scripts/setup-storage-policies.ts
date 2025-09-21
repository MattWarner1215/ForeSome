#!/usr/bin/env node
/**
 * Setup Storage RLS Policies using Service Role Key
 * This script uses the service role key to properly configure storage policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStoragePolicies() {
  console.log('🚀 Setting up storage RLS policies...\n')

  try {
    // Enable RLS on storage.objects
    const enableRLS = `
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLS })
    if (rlsError) {
      console.log('ℹ️  RLS may already be enabled:', rlsError.message)
    } else {
      console.log('✅ Enabled RLS on storage.objects')
    }

    // Drop existing policies to avoid conflicts
    const dropPolicies = `
      DROP POLICY IF EXISTS "Allow authenticated users to manage group icons" ON storage.objects;
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    `

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies })
    if (dropError) {
      console.log('ℹ️  Error dropping existing policies (may not exist):', dropError.message)
    } else {
      console.log('✅ Dropped existing policies')
    }

    // Create new policy for group icons
    const createPolicy = `
      CREATE POLICY "Allow authenticated users to manage group icons"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (bucket_id = 'group-icons')
      WITH CHECK (bucket_id = 'group-icons');
    `

    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicy })
    if (policyError) {
      console.error('❌ Error creating policy:', policyError.message)

      // Fallback: try a more permissive policy
      console.log('🔧 Trying fallback permissive policy...')
      const fallbackPolicy = `
        CREATE POLICY "Allow all for group icons"
        ON storage.objects
        FOR ALL
        USING (bucket_id = 'group-icons')
        WITH CHECK (bucket_id = 'group-icons');
      `

      const { error: fallbackError } = await supabase.rpc('exec_sql', { sql: fallbackPolicy })
      if (fallbackError) {
        console.error('❌ Fallback policy also failed:', fallbackError.message)
        return false
      } else {
        console.log('✅ Created fallback permissive policy')
      }
    } else {
      console.log('✅ Created group icons policy')
    }

    console.log('\n🎉 Storage policies setup complete!')
    return true

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return false
  }
}

setupStoragePolicies().then((success) => {
  if (success) {
    console.log('\n📋 Next: Try uploading a group icon!')
  } else {
    console.log('\n📋 Manual setup required in Supabase dashboard')
  }
  process.exit(success ? 0 : 1)
})