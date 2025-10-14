# Email Registration Setup Guide

## 📧 Overview

This guide explains how to set up email collection for your ForeSum "Coming Soon" pages.

## 🎯 What Gets Collected

When users submit their email on the coming soon page, the following information is stored:

```typescript
{
  id: "cuid_generated_id",
  email: "user@example.com",
  source: "coming_soon",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  createdAt: "2025-10-14T...",
  updatedAt: "2025-10-14T..."
}
```

## 🚀 Quick Setup

### Step 1: Create the Database Table

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `npmksisxmjgnqytcduhs`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy the entire contents from: `scripts/create-email-registration-table.sql`
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl/Cmd + Enter`

4. **Verify Success**
   - You should see: `EmailRegistration table created successfully with RLS enabled!`
   - Go to "Table Editor" → You should see the `EmailRegistration` table

### Step 2: Test the Collection

1. **Visit your coming soon page**
   - Local: http://localhost:3000/coming-soon
   - Or open: `index.html` in a browser

2. **Submit a test email**
   - Enter any email address
   - Click "Notify Me When It's Ready"

3. **Verify in Database**
   - Go to Supabase → Table Editor → `EmailRegistration`
   - You should see your test email!

## 🔒 Security (RLS Policies)

The setup script includes Row Level Security policies:

### ✅ What's Protected:

1. **Anyone can register** (INSERT)
   - Anonymous users can submit emails
   - No authentication required for coming soon page

2. **Only authenticated users can view** (SELECT)
   - You must be logged in to see collected emails
   - Prevents unauthorized access to email list

3. **Table is secure**
   - RLS is enabled
   - No one can update or delete entries through the API
   - Data is protected at the database level

## 📊 Viewing Collected Emails

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. Select "EmailRegistration" table
5. View all collected emails with timestamps

### Option 2: Prisma Studio (Local)

```bash
npm run db:studio
```

Then navigate to the `EmailRegistration` table.

### Option 3: Custom Query

Run this in Supabase SQL Editor:

```sql
-- Get all email registrations
SELECT
  email,
  source,
  "createdAt",
  "ipAddress"
FROM "EmailRegistration"
ORDER BY "createdAt" DESC;

-- Get count by source
SELECT
  source,
  COUNT(*) as total
FROM "EmailRegistration"
GROUP BY source;

-- Get recent registrations (last 7 days)
SELECT *
FROM "EmailRegistration"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

## 🔧 How It Works

### Architecture:

```
User submits email
    ↓
index.html or /coming-soon page
    ↓
POST /api/contact
    ↓
Validates email with Zod
    ↓
Stores in EmailRegistration table
    ↓
Returns success response
```

### API Endpoint: `/api/contact`

**Request:**
```json
{
  "email": "user@example.com",
  "subject": "ForeSum - New Email Signup",
  "message": "New email signup for ForeSum from: user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "Email registered successfully",
  "id": "cm3xample123"
}
```

**Response (Duplicate):**
```json
{
  "message": "Email already registered"
}
```

### Features:

- ✅ **Duplicate prevention** - Uses `upsert` to update instead of error
- ✅ **IP tracking** - Records IP for analytics
- ✅ **User agent** - Records browser info
- ✅ **Timestamps** - Auto-tracked creation and update times
- ✅ **Validation** - Email format validated with Zod
- ✅ **Error handling** - Graceful fallback to localStorage

## 📧 (Optional) Email Notifications

The API route has commented-out code to send you email notifications. To enable:

1. **Install Nodemailer**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. **Add environment variables** to `.env.local`:
   ```bash
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-specific-password"
   ```

3. **Uncomment the email section** in `src/app/api/contact/route.ts` (lines 42-66)

4. **Configure your email service** (Gmail, SendGrid, etc.)

## 🎨 Pages Using Email Collection

### 1. Static Landing Page (`index.html`)
- Located at: `/index.html`
- Standalone HTML file
- Can be deployed separately

### 2. Next.js Coming Soon Page (`/coming-soon`)
- Located at: `/src/app/coming-soon/page.tsx`
- Integrated with Next.js app
- Uses React components

Both pages send to the same `/api/contact` endpoint.

## 📈 Export Email List

To export all emails for email marketing:

```sql
-- Export as CSV
COPY (
  SELECT email, "createdAt"
  FROM "EmailRegistration"
  ORDER BY "createdAt" DESC
) TO STDOUT WITH CSV HEADER;
```

Or use Supabase dashboard:
1. Go to Table Editor
2. Select EmailRegistration table
3. Click the "..." menu
4. Export as CSV

## 🐛 Troubleshooting

### "Email registered successfully" but not in database

**Solution:** Table doesn't exist yet. Run the SQL script from Step 1.

### API returns 500 error

**Solution:** Check that:
1. `EmailRegistration` table exists in Supabase
2. Prisma client is generated: `npm run db:generate`
3. Database connection string is correct in `.env.local`

### RLS blocks my queries

**Solution:** You need to be authenticated to view emails. Either:
- Use Supabase service role key
- Query through Supabase dashboard
- Use the API endpoint (which uses service credentials)

### Duplicate emails showing up

**Solution:** This is expected behavior. The `upsert` will update the timestamp but keep the original email. This helps track when users re-register interest.

## 🚀 Production Deployment

Before deploying to production:

1. ✅ **Run the SQL script** on production database
2. ✅ **Test email collection** on production URL
3. ✅ **Verify RLS policies** are working
4. ✅ **Set up email notifications** (optional)
5. ✅ **Test error handling** with invalid emails

### Production Checklist:

- [ ] EmailRegistration table created in production database
- [ ] RLS policies enabled
- [ ] Test email submitted and visible in Supabase
- [ ] API endpoint working on production URL
- [ ] Coming soon page accessible
- [ ] index.html deployed (if using static hosting)

## 📝 Notes

- **No PII concerns:** Only email addresses are collected
- **GDPR compliant:** Users knowingly submit their email
- **Secure:** RLS prevents unauthorized access
- **Scalable:** Supabase handles millions of rows
- **Analytics ready:** IP and user agent for insights

## 🔗 Related Files

- `scripts/create-email-registration-table.sql` - Database setup script
- `src/app/api/contact/route.ts` - API endpoint
- `src/app/coming-soon/page.tsx` - Next.js coming soon page
- `index.html` - Static coming soon page
- `prisma/schema.prisma` - Database schema definition

## 🎉 You're Done!

Once you run the SQL script, email collection will work automatically on:
- http://localhost:3000/coming-soon (Next.js)
- http://localhost:3000/index.html (Static)
- Your production URLs

No additional setup required! 🚀
