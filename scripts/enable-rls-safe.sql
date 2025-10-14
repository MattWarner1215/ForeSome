-- =====================================================
-- Enable Row Level Security (RLS) - Safe Version
-- =====================================================
-- This script safely adds missing RLS policies without failing on duplicates
-- Run this in Supabase SQL Editor

-- =====================================================
-- Step 1: Drop existing policies if they exist
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on _ChatRoomToUser
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = '_ChatRoomToUser') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "_ChatRoomToUser"';
    END LOOP;
END $$;

-- =====================================================
-- Step 2: Enable RLS on _ChatRoomToUser (if not already)
-- =====================================================
ALTER TABLE "_ChatRoomToUser" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 3: Create _ChatRoomToUser Policies
-- =====================================================

-- Users can view chat room members if they're in the room or have match access
CREATE POLICY "Users can view chat room members"
  ON "_ChatRoomToUser"
  FOR SELECT
  USING (
    -- User is a member of this chat room
    "B" = (select auth.uid())::text OR
    -- User has access to the match that owns this chat room
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "A"
      AND (
        -- User is the match creator
        m."creatorId" = (select auth.uid())::text OR
        -- User is an accepted participant
        EXISTS (
          SELECT 1 FROM "MatchPlayer" mp
          WHERE mp."matchId" = m."id"
          AND mp."playerId" = (select auth.uid())::text
          AND mp."status" = 'accepted'
        )
      )
    )
  );

-- Users can add themselves to chat rooms for matches they're in
CREATE POLICY "Users can join their own chats"
  ON "_ChatRoomToUser"
  FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    "B" = (select auth.uid())::text AND
    -- Chat room belongs to a match they have access to
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "A"
      AND (
        m."creatorId" = (select auth.uid())::text OR
        EXISTS (
          SELECT 1 FROM "MatchPlayer" mp
          WHERE mp."matchId" = m."id"
          AND mp."playerId" = (select auth.uid())::text
          AND mp."status" = 'accepted'
        )
      )
    )
  );

-- Users can leave chat rooms they're in
CREATE POLICY "Users can leave chat rooms"
  ON "_ChatRoomToUser"
  FOR DELETE
  USING (
    -- User is removing themselves
    "B" = (select auth.uid())::text OR
    -- Match creator can remove participants
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "A"
      AND m."creatorId" = (select auth.uid())::text
    )
  );

-- =====================================================
-- Success Message
-- =====================================================
SELECT '_ChatRoomToUser RLS policies created successfully!' as message;
