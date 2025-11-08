-- Add email notification preferences to User table

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailJoinRequests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailJoinApprovals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailMatchUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailGroupInvitations" BOOLEAN NOT NULL DEFAULT true;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name LIKE 'email%'
ORDER BY column_name;
