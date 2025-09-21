#!/usr/bin/env node
/**
 * Script to add icon column to Group table
 * This script connects directly to Supabase to add the missing icon column
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addIconColumn() {
  console.log('🚀 Adding icon column to Group table...\n')

  try {
    // First check if the column already exists
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'Group' })

    if (!columnError && columns && columns.some(col => col.column_name === 'icon')) {
      console.log('✅ Icon column already exists in Group table')
      return
    }

    // Add the icon column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "icon" TEXT;'
    })

    if (error) {
      console.error('❌ Error adding icon column:', error)
      console.log('\n🔧 Trying alternative method...')

      // Try using raw SQL query
      const { data: result, error: sqlError } = await supabase
        .from('Group')
        .select('*')
        .limit(1)

      if (sqlError && sqlError.message.includes('column "icon" does not exist')) {
        console.log('📋 Please manually add the icon column in Supabase Dashboard:')
        console.log('1. Go to https://supabase.com/dashboard')
        console.log('2. Select your project')
        console.log('3. Go to Table Editor > Group table')
        console.log('4. Click "Add Column"')
        console.log('5. Name: icon, Type: text, Nullable: true')
        console.log('6. Click Save')
      }

      process.exit(1)
    }

    console.log('🎉 Successfully added icon column to Group table!')

  } catch (error) {
    console.error('❌ Script error:', error)
    console.log('\n📋 Manual steps to add the column:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Table Editor > Group table')
    console.log('4. Click "Add Column"')
    console.log('5. Name: icon, Type: text, Nullable: true')
    console.log('6. Click Save')
    process.exit(1)
  }
}

addIconColumn().catch((error) => {
  console.error('Execution failed:', error)
  process.exit(1)
})