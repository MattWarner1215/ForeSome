-- Simple RLS Policy for Group Icons (Temporary)
-- Run this in your Supabase SQL Editor

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group icons are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can upload group icons" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can update their group icons" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can delete their group icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage group icons" ON storage.objects;

-- Simple policy: Allow authenticated users to manage group icons
CREATE POLICY "Allow authenticated users to manage group icons"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'group-icons')
WITH CHECK (bucket_id = 'group-icons');