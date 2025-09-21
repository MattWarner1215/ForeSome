import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  GOLF_COURSES: 'golf-courses',
  BACKGROUNDS: 'backgrounds',
  LOGOS: 'logos'
} as const

// Helper function to get public URL for uploaded files
export const getStoragePublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Helper function to upload file to storage
export const uploadFileToStorage = async (
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string
    upsert?: boolean
  }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    })
  
  if (error) {
    throw error
  }
  
  return data
}

// Helper function to delete file from storage
export const deleteFileFromStorage = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    throw error
  }
}

// Helper function to generate unique filename
export const generateUniqueFilename = (originalName: string, userId: string) => {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  return `${userId}_${timestamp}.${extension}`
}