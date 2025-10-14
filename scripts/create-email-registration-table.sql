-- Create EmailRegistration table manually
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "EmailRegistration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "source" TEXT NOT NULL DEFAULT 'coming_soon',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "EmailRegistration_email_idx" ON "EmailRegistration"("email");
CREATE INDEX IF NOT EXISTS "EmailRegistration_createdAt_idx" ON "EmailRegistration"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailRegistration_source_idx" ON "EmailRegistration"("source");

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE "EmailRegistration" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Allow anonymous email registration for coming soon page
CREATE POLICY "Anyone can register email"
  ON "EmailRegistration"
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view registrations (admin access)
CREATE POLICY "Authenticated users can view registrations"
  ON "EmailRegistration"
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Success message
SELECT 'EmailRegistration table created successfully with RLS enabled!' as message;
