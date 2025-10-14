# 🚀 Quick Setup - Email Registration

## ⚡ 3-Minute Setup

### 1️⃣ Create Table (Copy & Paste This)

Go to [Supabase SQL Editor](https://supabase.com/dashboard) and run:

```sql
CREATE TABLE IF NOT EXISTS "EmailRegistration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "source" TEXT NOT NULL DEFAULT 'coming_soon',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailRegistration_email_idx" ON "EmailRegistration"("email");
CREATE INDEX IF NOT EXISTS "EmailRegistration_createdAt_idx" ON "EmailRegistration"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailRegistration_source_idx" ON "EmailRegistration"("source");

ALTER TABLE "EmailRegistration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register email"
  ON "EmailRegistration"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations"
  ON "EmailRegistration"
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
```

### 2️⃣ Test It

Visit: http://localhost:3000/coming-soon

Submit any email → Check Supabase Table Editor

### 3️⃣ View Collected Emails

**Supabase Dashboard:**
Table Editor → EmailRegistration

**Or locally:**
```bash
npm run db:studio
```

## ✅ Done!

Your coming soon pages are now collecting emails automatically! 🎉

---

📖 **Full Documentation:** `docs/EMAIL-REGISTRATION-SETUP.md`
