# Row Level Security (RLS) Setup Guide

## Overview
This guide explains how to enable Row Level Security on all ForeSome database tables to ensure data privacy and security at the database level.

## What is RLS?
Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access based on policies you define. This adds a critical security layer independent of your application code.

## Prerequisites
- Access to Supabase Dashboard
- Database admin privileges
- Your database must be running PostgreSQL (which Supabase uses)

## Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: (Optional) Create EmailRegistration Table
If you want to use the "Coming Soon" page with email collection:
1. Open `scripts/create-email-registration-table.sql`
2. Copy and paste into Supabase SQL Editor
3. Run the script
4. This will create the table with RLS already enabled

### Step 3: Run the RLS Script
1. Open the file `scripts/enable-rls.sql` in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl/Cmd + Enter`

**Note:** The EmailRegistration table policies are commented out by default. If you created the table in Step 2, you can skip uncommenting them as they're already created.

### Step 4: Verify RLS is Enabled
Run this query to check which tables have RLS enabled:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All `rowsecurity` values should be `true`.

### Step 5: Update Your Application Code

#### Important: Use Service Role for Server-Side Operations
For server-side operations (API routes), you need to use the **service role key** which bypasses RLS:

```typescript
// In your API routes
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Not the anon key!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

#### Add Service Role Key to Environment
Add to your `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can find the service role key in:
1. Supabase Dashboard → Project Settings → API
2. Look for "service_role" key (keep this secret!)

## Policy Summary by Table

### User Table
- ✅ Anyone can view all users (for search/leaderboard)
- ✅ Users can update their own profile
- ✅ Users can create their account during signup

### Match Table
- ✅ Anyone can view public matches
- ✅ Users can view matches they created or joined
- ✅ Group members can view shared private matches
- ✅ Users can create matches
- ✅ Match creators can update/delete their matches

### Group Table
- ✅ Users can view public groups
- ✅ Users can view groups they're members of
- ✅ Users can create groups
- ✅ Group creators and admins can update groups
- ✅ Group creators can delete groups

### Notification Table
- ✅ Users can only view their own notifications
- ✅ Users can mark their notifications as read
- ✅ System can create notifications via service role

### Chat Table
- ✅ Users can view chat rooms for matches they're in
- ✅ Users can send messages to accessible chat rooms
- ✅ Users can update/delete their own messages

### Rating Table
- ✅ Anyone can view ratings (public leaderboard data)
- ✅ Users can rate players they've played with
- ✅ Users can update/delete their own ratings

### GolfCourse Table
- ✅ Everyone can view golf courses (public directory)
- ✅ Authenticated users can suggest new courses

## Testing RLS Policies

### Test 1: User Can Only See Their Own Notifications
```sql
-- Should return empty if you're not the owner
SELECT * FROM "Notification" WHERE "userId" = 'different_user_id';
```

### Test 2: User Can View Public Matches
```sql
-- Should return public matches
SELECT * FROM "Match" WHERE "isPublic" = true;
```

### Test 3: User Cannot Update Other Users' Profiles
```sql
-- Should fail with RLS error
UPDATE "User" SET name = 'Hacker' WHERE id = 'different_user_id';
```

## Updating Existing API Routes

After enabling RLS, update your API routes to use the admin client for database operations:

### Before (using anon key - will be restricted by RLS):
```typescript
import { supabase } from '@/lib/supabase'

// This will now be restricted by RLS
const { data } = await supabase.from('User').select('*')
```

### After (using service role - bypasses RLS):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// This bypasses RLS for admin operations
const { data } = await supabaseAdmin.from('User').select('*')
```

## Important Security Notes

### ⚠️ NEVER expose service role key to client
- Service role key should ONLY be used in server-side code
- Never include it in client-side code or commit it to Git
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and `.gitignore`

### ✅ Use anon key for client-side operations
- Client-side operations should use the anon key
- RLS policies will automatically restrict what users can access
- This is already configured in your `src/lib/supabase.ts`

## Prisma Integration Notes

Since you're using Prisma as your ORM, RLS policies are enforced at the PostgreSQL level, which means:

1. **Your Prisma queries will respect RLS policies** when using the anon key
2. **Your API routes should continue using Prisma** - no changes needed
3. **Prisma bypasses RLS** when using the connection string with superuser credentials

### For Most Operations (Current Setup - Good!)
Continue using Prisma in your API routes as-is:
```typescript
import { prisma } from '@/lib/prisma'

// This uses your DATABASE_URL which has superuser access
const users = await prisma.user.findMany()
```

### Optional: Add RLS-Aware Supabase Client
For specific operations where you want RLS enforcement, you can add a Supabase client:
```typescript
// Use this when you want RLS to apply
const supabaseRLS = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Rollback Instructions

If you need to disable RLS (not recommended for production):

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

## Next Steps

1. ✅ Run the RLS script in Supabase SQL Editor
2. ✅ Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
3. ✅ Test your application thoroughly
4. ✅ Monitor for any access errors in your logs
5. ✅ Update production environment variables before deploying

## Troubleshooting

### Error: "new row violates row-level security policy"
- You're trying to insert/update data that violates RLS policies
- Make sure you're using the service role key for admin operations
- Check that `auth.uid()` matches the user performing the action

### Error: "permission denied for table"
- Your database user lacks permissions
- Run the script as a superuser or use Supabase SQL Editor

### Queries Return No Results
- RLS is working! The user doesn't have permission to see that data
- Verify your policies are correct for the intended access pattern
- Use service role key for admin operations that need full access

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma + RLS Best Practices](https://www.prisma.io/docs/guides/database/using-prisma-with-postgresql-row-level-security)
