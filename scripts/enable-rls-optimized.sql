-- =====================================================
-- Enable Row Level Security (RLS) on All Tables
-- =====================================================
-- Run this script in Supabase SQL Editor
-- This enables RLS and creates OPTIMIZED policies for all tables
--
-- PERFORMANCE FIX: Uses (select auth.uid()) instead of auth.uid()
-- This prevents re-evaluation of auth functions for each row
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Enable RLS on all tables
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MatchPlayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GolfCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatRoom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_ChatRoomToUser" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EmailRegistration" ENABLE ROW LEVEL SECURITY; -- Commented out - table doesn't exist yet

-- =====================================================
-- User Table Policies
-- =====================================================

-- Users can view all users (for search, leaderboard, etc.)
CREATE POLICY "Users can view all users"
  ON "User"
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING ((select auth.uid())::text = id)
  WITH CHECK ((select auth.uid())::text = id);

-- Users can insert themselves during signup (handled by service role)
CREATE POLICY "Users can insert themselves"
  ON "User"
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Account Table Policies (NextAuth)
-- =====================================================

CREATE POLICY "Users can view own accounts"
  ON "Account"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

CREATE POLICY "Users can insert own accounts"
  ON "Account"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "Users can update own accounts"
  ON "Account"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "Users can delete own accounts"
  ON "Account"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- Session Table Policies (NextAuth)
-- =====================================================

CREATE POLICY "Users can view own sessions"
  ON "Session"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

CREATE POLICY "Users can insert own sessions"
  ON "Session"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "Users can update own sessions"
  ON "Session"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "Users can delete own sessions"
  ON "Session"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- Match Table Policies
-- =====================================================

-- Anyone can view public matches
CREATE POLICY "Anyone can view public matches"
  ON "Match"
  FOR SELECT
  USING ("isPublic" = true OR (select auth.uid())::text = "creatorId" OR
         EXISTS (
           SELECT 1 FROM "MatchPlayer"
           WHERE "matchId" = "Match"."id"
           AND "playerId" = (select auth.uid())::text
         ) OR
         EXISTS (
           SELECT 1 FROM "GroupMatch" gm
           INNER JOIN "GroupMember" gme ON gm."groupId" = gme."groupId"
           WHERE gm."matchId" = "Match"."id"
           AND gme."userId" = (select auth.uid())::text
         ));

-- Users can create matches
CREATE POLICY "Users can create matches"
  ON "Match"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "creatorId");

-- Match creators can update their matches
CREATE POLICY "Match creators can update own matches"
  ON "Match"
  FOR UPDATE
  USING ((select auth.uid())::text = "creatorId")
  WITH CHECK ((select auth.uid())::text = "creatorId");

-- Match creators can delete their matches
CREATE POLICY "Match creators can delete own matches"
  ON "Match"
  FOR DELETE
  USING ((select auth.uid())::text = "creatorId");

-- =====================================================
-- MatchPlayer Table Policies
-- =====================================================

-- Users can view match players for matches they can see
CREATE POLICY "Users can view match players"
  ON "MatchPlayer"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Match" m
      WHERE m."id" = "matchId"
      AND (m."isPublic" = true OR m."creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."matchId" = m."id" AND mp."playerId" = (select auth.uid())::text))
    )
  );

-- Users can join matches (insert)
CREATE POLICY "Users can join matches"
  ON "MatchPlayer"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "playerId");

-- Users can update their own match player status
CREATE POLICY "Users can update own match player status"
  ON "MatchPlayer"
  FOR UPDATE
  USING ((select auth.uid())::text = "playerId" OR
         EXISTS (SELECT 1 FROM "Match" WHERE "id" = "matchId" AND "creatorId" = (select auth.uid())::text))
  WITH CHECK ((select auth.uid())::text = "playerId" OR
              EXISTS (SELECT 1 FROM "Match" WHERE "id" = "matchId" AND "creatorId" = (select auth.uid())::text));

-- Users and match creators can delete match players
CREATE POLICY "Users can leave matches"
  ON "MatchPlayer"
  FOR DELETE
  USING ((select auth.uid())::text = "playerId" OR
         EXISTS (SELECT 1 FROM "Match" WHERE "id" = "matchId" AND "creatorId" = (select auth.uid())::text));

-- =====================================================
-- Group Table Policies
-- =====================================================

-- Users can view groups they're members of or public groups
CREATE POLICY "Users can view accessible groups"
  ON "Group"
  FOR SELECT
  USING (
    "isPrivate" = false OR
    (select auth.uid())::text = "creatorId" OR
    EXISTS (
      SELECT 1 FROM "GroupMember"
      WHERE "groupId" = "Group"."id"
      AND "userId" = (select auth.uid())::text
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups"
  ON "Group"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "creatorId");

-- Group creators and admins can update groups
CREATE POLICY "Group creators and admins can update groups"
  ON "Group"
  FOR UPDATE
  USING (
    (select auth.uid())::text = "creatorId" OR
    EXISTS (
      SELECT 1 FROM "GroupMember"
      WHERE "groupId" = "Group"."id"
      AND "userId" = (select auth.uid())::text
      AND "role" = 'admin'
    )
  )
  WITH CHECK (
    (select auth.uid())::text = "creatorId" OR
    EXISTS (
      SELECT 1 FROM "GroupMember"
      WHERE "groupId" = "Group"."id"
      AND "userId" = (select auth.uid())::text
      AND "role" = 'admin'
    )
  );

-- Group creators can delete groups
CREATE POLICY "Group creators can delete groups"
  ON "Group"
  FOR DELETE
  USING ((select auth.uid())::text = "creatorId");

-- =====================================================
-- GroupMember Table Policies
-- =====================================================

-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members"
  ON "GroupMember"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Group" g
      WHERE g."id" = "groupId"
      AND (g."creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "GroupMember" gm WHERE gm."groupId" = g."id" AND gm."userId" = (select auth.uid())::text))
    )
  );

-- Group creators and admins can add members
CREATE POLICY "Group creators and admins can add members"
  ON "GroupMember"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "groupId"
      AND ("creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "GroupMember" WHERE "groupId" = "Group"."id" AND "userId" = (select auth.uid())::text AND "role" = 'admin'))
    )
  );

-- Group creators and admins can update member roles
CREATE POLICY "Group creators and admins can update members"
  ON "GroupMember"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "groupId"
      AND ("creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "GroupMember" WHERE "groupId" = "Group"."id" AND "userId" = (select auth.uid())::text AND "role" = 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "groupId"
      AND ("creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "GroupMember" WHERE "groupId" = "Group"."id" AND "userId" = (select auth.uid())::text AND "role" = 'admin'))
    )
  );

-- Users can leave groups (delete themselves)
CREATE POLICY "Users can leave groups"
  ON "GroupMember"
  FOR DELETE
  USING (
    (select auth.uid())::text = "userId" OR
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "groupId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- =====================================================
-- GroupMatch Table Policies
-- =====================================================

-- Users can view group matches for groups they belong to
CREATE POLICY "Users can view group matches"
  ON "GroupMatch"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "GroupMember"
      WHERE "groupId" = "GroupMatch"."groupId"
      AND "userId" = (select auth.uid())::text
    ) OR
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "GroupMatch"."groupId"
      AND "creatorId" = (select auth.uid())::text
    ) OR
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "GroupMatch"."matchId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- Match creators can add their matches to groups
CREATE POLICY "Match creators can share matches with groups"
  ON "GroupMatch"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "matchId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- Match creators can remove their matches from groups
CREATE POLICY "Match creators can unshare matches"
  ON "GroupMatch"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "matchId"
      AND "creatorId" = (select auth.uid())::text
    ) OR
    EXISTS (
      SELECT 1 FROM "Group"
      WHERE "id" = "groupId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- =====================================================
-- Rating Table Policies
-- =====================================================

-- Users can view all ratings (public information)
CREATE POLICY "Users can view all ratings"
  ON "Rating"
  FOR SELECT
  USING (true);

-- Users can rate others they've played with
CREATE POLICY "Users can rate players"
  ON "Rating"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "ratedById");

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON "Rating"
  FOR UPDATE
  USING ((select auth.uid())::text = "ratedById")
  WITH CHECK ((select auth.uid())::text = "ratedById");

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON "Rating"
  FOR DELETE
  USING ((select auth.uid())::text = "ratedById");

-- =====================================================
-- GolfCourse Table Policies
-- =====================================================

-- Everyone can view golf courses (public directory)
CREATE POLICY "Everyone can view golf courses"
  ON "GolfCourse"
  FOR SELECT
  USING (true);

-- Only authenticated users can suggest new courses (optional)
CREATE POLICY "Authenticated users can suggest courses"
  ON "GolfCourse"
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- Notification Table Policies
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON "Notification"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

-- System can create notifications (service role)
CREATE POLICY "Authenticated users can create notifications"
  ON "Notification"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "senderId" OR (select auth.uid()) IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON "Notification"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON "Notification"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- ChatRoom Table Policies
-- =====================================================

-- Users can view chat rooms for matches they're part of
CREATE POLICY "Users can view accessible chat rooms"
  ON "ChatRoom"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Match" m
      WHERE m."id" = "matchId"
      AND (m."creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."matchId" = m."id" AND mp."playerId" = (select auth.uid())::text AND mp."status" = 'accepted'))
    )
  );

-- Match creators can create chat rooms
CREATE POLICY "Match creators can create chat rooms"
  ON "ChatRoom"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "matchId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- Match creators can update chat rooms
CREATE POLICY "Match creators can update chat rooms"
  ON "ChatRoom"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "matchId"
      AND "creatorId" = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Match"
      WHERE "id" = "matchId"
      AND "creatorId" = (select auth.uid())::text
    )
  );

-- =====================================================
-- ChatMessage Table Policies
-- =====================================================

-- Users can view messages in chat rooms they have access to
CREATE POLICY "Users can view accessible chat messages"
  ON "ChatMessage"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "chatRoomId"
      AND (m."creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."matchId" = m."id" AND mp."playerId" = (select auth.uid())::text AND mp."status" = 'accepted'))
    )
  );

-- Users can send messages to chat rooms they have access to
CREATE POLICY "Users can send chat messages"
  ON "ChatMessage"
  FOR INSERT
  WITH CHECK (
    (select auth.uid())::text = "senderId" AND
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "chatRoomId"
      AND (m."creatorId" = (select auth.uid())::text OR
           EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."matchId" = m."id" AND mp."playerId" = (select auth.uid())::text AND mp."status" = 'accepted'))
    )
  );

-- Users can update their own messages (mark as read, edit content)
CREATE POLICY "Users can update own messages"
  ON "ChatMessage"
  FOR UPDATE
  USING ((select auth.uid())::text = "senderId")
  WITH CHECK ((select auth.uid())::text = "senderId");

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON "ChatMessage"
  FOR DELETE
  USING ((select auth.uid())::text = "senderId");

-- =====================================================
-- Verification Token Policies (NextAuth)
-- =====================================================

-- Allow anonymous access for email verification
CREATE POLICY "Anyone can use verification tokens"
  ON "VerificationToken"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Password Reset Token Policies
-- =====================================================

-- Allow anonymous access for password reset
CREATE POLICY "Anyone can use password reset tokens"
  ON "PasswordResetToken"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Email Registration Policies (COMMENTED OUT - Table doesn't exist yet)
-- =====================================================
-- Uncomment these policies after creating the EmailRegistration table

-- Allow anonymous email registration for coming soon page
-- CREATE POLICY "Anyone can register email"
--   ON "EmailRegistration"
--   FOR INSERT
--   WITH CHECK (true);

-- Only authenticated users can view registrations (admin)
-- CREATE POLICY "Authenticated users can view registrations"
--   ON "EmailRegistration"
--   FOR SELECT
--   USING ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- _ChatRoomToUser Join Table Policies (Prisma implicit many-to-many)
-- =====================================================
-- This table links Users to ChatRooms (chat room members)

-- Users can view chat room memberships for rooms they have access to
CREATE POLICY "Users can view chat room members"
  ON "_ChatRoomToUser"
  FOR SELECT
  USING (
    -- User is a member of the chat room
    "B" = (select auth.uid())::text OR
    -- User has access to the match associated with the chat room
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

-- System can add users to chat rooms (managed by application logic)
CREATE POLICY "Match participants can be added to chat rooms"
  ON "_ChatRoomToUser"
  FOR INSERT
  WITH CHECK (
    -- User being added is the authenticated user (users can join their own chats)
    "B" = (select auth.uid())::text OR
    -- Or the authenticated user is the match creator
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "A"
      AND m."creatorId" = (select auth.uid())::text
    )
  );

-- Users can remove themselves from chat rooms
CREATE POLICY "Users can leave chat rooms"
  ON "_ChatRoomToUser"
  FOR DELETE
  USING (
    "B" = (select auth.uid())::text OR
    -- Or the authenticated user is the match creator
    EXISTS (
      SELECT 1 FROM "ChatRoom" cr
      INNER JOIN "Match" m ON cr."matchId" = m."id"
      WHERE cr."id" = "A"
      AND m."creatorId" = (select auth.uid())::text
    )
  );
