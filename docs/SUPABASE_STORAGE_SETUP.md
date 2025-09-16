# Supabase Storage Setup Guide

Since the automated script can't create buckets due to RLS policies, follow these manual steps:

## Step 1: Create Storage Buckets

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your ForeSome project

2. **Navigate to Storage**
   - Click on **Storage** in the left sidebar
   - Click **Create a new bucket**

3. **Create these 4 buckets:**

   **Bucket 1: avatars**
   - Name: `avatars`
   - Public bucket: ✅ Yes
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`
   - File size limit: `5242880` (5MB)

   **Bucket 2: golf-courses**
   - Name: `golf-courses`
   - Public bucket: ✅ Yes
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`
   - File size limit: `5242880` (5MB)

   **Bucket 3: backgrounds**
   - Name: `backgrounds`
   - Public bucket: ✅ Yes
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`
   - File size limit: `10485760` (10MB)

   **Bucket 4: logos**
   - Name: `logos`
   - Public bucket: ✅ Yes
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp,image/svg+xml`
   - File size limit: `2097152` (2MB)

## Step 2: Configure RLS Policies

1. **Go to Authentication > Policies**
2. **Create policies for each bucket:**

### Avatars Bucket Policies

**Policy 1: Anyone can view avatars (public read)**
```sql
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

**Policy 2: Authenticated users can upload avatars**
```sql
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

**Policy 3: Authenticated users can update avatars**
```sql
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

**Policy 4: Authenticated users can delete avatars**
```sql
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

### Other Buckets (golf-courses, backgrounds, logos)

**Public read access:**
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'golf-courses');

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'backgrounds');

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');
```

**Admin write access (you can add these later):**
```sql
-- Only add if you need admin upload functionality
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'golf-courses' AND auth.role() = 'authenticated');
```

## Step 3: Test Avatar Upload

After creating the buckets and policies:

1. Restart your development server: `npm run dev`
2. Go to your profile page in the app
3. Try uploading an avatar image
4. Check that it appears and the URL starts with your Supabase URL

## Troubleshooting

**If avatar upload fails:**
1. Check browser console for errors
2. Verify bucket names match exactly: `avatars`, `golf-courses`, `backgrounds`, `logos`
3. Ensure RLS policies are active and correctly configured
4. Check that your `.env.local` has the correct Supabase URL and anon key

**If images don't load:**
1. Verify buckets are set to **public**
2. Check that the public read policies are in place
3. Test accessing the image URL directly in a browser

## Success Indicators

✅ Buckets created successfully
✅ RLS policies configured
✅ Avatar upload works without errors
✅ Avatar images display in the app
✅ Old avatars are cleaned up when new ones are uploaded

Once everything works, you can delete this setup file.