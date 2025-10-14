-- =====================================================
-- Drop All RLS Policies
-- =====================================================
-- Run this script BEFORE applying the optimized RLS script
-- This removes all existing policies so you can replace them

-- User Table Policies
DROP POLICY IF EXISTS "Users can view all users" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can insert themselves" ON "User";

-- Account Table Policies
DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can insert own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can update own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can delete own accounts" ON "Account";

-- Session Table Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can insert own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can update own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can delete own sessions" ON "Session";

-- Match Table Policies
DROP POLICY IF EXISTS "Anyone can view public matches" ON "Match";
DROP POLICY IF EXISTS "Users can create matches" ON "Match";
DROP POLICY IF EXISTS "Match creators can update own matches" ON "Match";
DROP POLICY IF EXISTS "Match creators can delete own matches" ON "Match";

-- MatchPlayer Table Policies
DROP POLICY IF EXISTS "Users can view match players" ON "MatchPlayer";
DROP POLICY IF EXISTS "Users can join matches" ON "MatchPlayer";
DROP POLICY IF EXISTS "Users can update own match player status" ON "MatchPlayer";
DROP POLICY IF EXISTS "Users can leave matches" ON "MatchPlayer";

-- Group Table Policies
DROP POLICY IF EXISTS "Users can view accessible groups" ON "Group";
DROP POLICY IF EXISTS "Users can create groups" ON "Group";
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON "Group";
DROP POLICY IF EXISTS "Group creators can delete groups" ON "Group";

-- GroupMember Table Policies
DROP POLICY IF EXISTS "Users can view group members" ON "GroupMember";
DROP POLICY IF EXISTS "Group creators and admins can add members" ON "GroupMember";
DROP POLICY IF EXISTS "Group creators and admins can update members" ON "GroupMember";
DROP POLICY IF EXISTS "Users can leave groups" ON "GroupMember";

-- GroupMatch Table Policies
DROP POLICY IF EXISTS "Users can view group matches" ON "GroupMatch";
DROP POLICY IF EXISTS "Match creators can share matches with groups" ON "GroupMatch";
DROP POLICY IF EXISTS "Match creators can unshare matches" ON "GroupMatch";

-- Rating Table Policies
DROP POLICY IF EXISTS "Users can view all ratings" ON "Rating";
DROP POLICY IF EXISTS "Users can rate players" ON "Rating";
DROP POLICY IF EXISTS "Users can update own ratings" ON "Rating";
DROP POLICY IF EXISTS "Users can delete own ratings" ON "Rating";

-- GolfCourse Table Policies
DROP POLICY IF EXISTS "Everyone can view golf courses" ON "GolfCourse";
DROP POLICY IF EXISTS "Authenticated users can suggest courses" ON "GolfCourse";

-- Notification Table Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can delete own notifications" ON "Notification";

-- ChatRoom Table Policies
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON "ChatRoom";
DROP POLICY IF EXISTS "Match creators can create chat rooms" ON "ChatRoom";
DROP POLICY IF EXISTS "Match creators can update chat rooms" ON "ChatRoom";

-- ChatMessage Table Policies
DROP POLICY IF EXISTS "Users can view accessible chat messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can send chat messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can update own messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can delete own messages" ON "ChatMessage";

-- VerificationToken Policies
DROP POLICY IF EXISTS "Anyone can use verification tokens" ON "VerificationToken";

-- PasswordResetToken Policies
DROP POLICY IF EXISTS "Anyone can use password reset tokens" ON "PasswordResetToken";


-- Success message
SELECT 'All RLS policies have been dropped. You can now run enable-rls-optimized.sql' as message;
