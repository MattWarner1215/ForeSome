-- Add icon column to Group table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Group'
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE "Group" ADD COLUMN "icon" TEXT;
        RAISE NOTICE 'Added icon column to Group table';
    ELSE
        RAISE NOTICE 'Icon column already exists in Group table';
    END IF;
END $$;