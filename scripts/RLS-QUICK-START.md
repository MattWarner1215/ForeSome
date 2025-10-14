# RLS Quick Start Guide

## ⚠️ Important: EmailRegistration Table Issue - FIXED

The `EmailRegistration` table doesn't exist in your database yet, so I've updated the RLS script to skip it.

## 🚀 Quick Setup (3 Steps)

### Option A: Without EmailRegistration Table (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in sidebar

2. **Run the RLS Script**
   - Copy all contents from: `scripts/enable-rls.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Done! RLS is now enabled on 15 tables

3. **Verify**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
   All should show `rowsecurity = true`

### Option B: With EmailRegistration Table

If you need the "Coming Soon" email collection feature:

1. **Create the EmailRegistration table first**
   - Copy from: `scripts/create-email-registration-table.sql`
   - Paste into SQL Editor
   - Run it

2. **Then follow Option A steps above**

## 📋 What Gets Protected?

✅ **15 Tables with RLS Enabled:**
- Account, Session, User
- VerificationToken, PasswordResetToken
- Match, MatchPlayer
- Group, GroupMember, GroupMatch
- Rating, GolfCourse
- Notification, ChatRoom, ChatMessage

## 🔒 Key Security Rules

- **Users** - Can view all, only update own profile
- **Matches** - Public visible to all, private only to participants/groups
- **Groups** - Members-only access
- **Notifications** - Users only see their own
- **Chat** - Only match participants can view/send messages
- **Ratings** - Public viewing, users can only create/edit their own

## ✅ Your Current Setup (Already Done!)

I can see you already have:
- ✅ `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- ✅ Database connection configured
- ✅ Prisma schema up to date

## 🎯 After Running RLS Script

**Your Prisma queries will continue to work normally** because:
- Your `DATABASE_URL` uses a superuser connection
- Prisma automatically bypasses RLS with superuser credentials
- No code changes needed!

## 🔍 Troubleshooting

### Error: "relation EmailRegistration does not exist"
✅ **FIXED** - The updated `enable-rls.sql` script skips this table

### Still seeing the error?
Make sure you're using the updated `scripts/enable-rls.sql` file. The line should be:
```sql
-- ALTER TABLE "EmailRegistration" ENABLE ROW LEVEL SECURITY; -- Commented out
```

### Want to test RLS is working?
Try this in SQL Editor with your anon key:
```sql
-- This should work (reading public data)
SELECT * FROM "GolfCourse" LIMIT 5;

-- This should return only your notifications (if any)
SELECT * FROM "Notification" WHERE "userId" = auth.uid()::text;
```

## 📚 Full Documentation

For detailed information, see:
- `scripts/RLS-SETUP-GUIDE.md` - Complete setup guide
- `scripts/enable-rls.sql` - The RLS script with all policies
- `scripts/create-email-registration-table.sql` - Optional table creation
- `scripts/check-tables.sql` - Check which tables exist

## 💡 Need Help?

Common questions:
- **Do I need to change my code?** No, if you're using Prisma with your current setup
- **Will this break my app?** No, Prisma uses a superuser connection that bypasses RLS
- **When does RLS apply?** Only when using Supabase client with anon/authenticated keys
- **Should I use service role in API routes?** Not needed - Prisma already bypasses RLS

## 🎉 Next Steps

1. Run the RLS script in Supabase SQL Editor
2. Test your application - everything should work as before
3. Deploy to production with confidence - your data is now protected at the database level!
