-- Supabase RLS Policies for Group Icons Storage
-- Run this in your Supabase SQL Editor

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view group icons
CREATE POLICY "Group icons are publicly viewable"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'group-icons');

-- Allow group creators to upload icons
CREATE POLICY "Group creators can upload group icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-icons' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow group creators to update their group icons
CREATE POLICY "Group creators can update their group icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-icons' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow group creators to delete their group icons
CREATE POLICY "Group creators can delete their group icons"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-icons' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative simpler policy if the above doesn't work
-- This allows any authenticated user to manage group icons
-- (You can use this temporarily and refine later)

/*
DROP POLICY IF EXISTS "Group icons are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can upload group icons" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can update their group icons" ON storage.objects;
DROP POLICY IF EXISTS "Group creators can delete their group icons" ON storage.objects;

CREATE POLICY "Allow authenticated users to manage group icons"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'group-icons')
WITH CHECK (bucket_id = 'group-icons');
*/