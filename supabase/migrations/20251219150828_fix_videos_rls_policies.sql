/*
  # Fix RLS Policies for Videos Table

  1. Security Changes
    - Drop existing insecure policies that allow public access to all videos
    - Create new restrictive policies that only allow users to access their own videos
    - Users can only SELECT, INSERT, UPDATE, and DELETE their own videos (matched by user_id)
  
  2. Important Notes
    - This is a critical security fix to prevent users from accessing other users' videos
    - All policies now check auth.uid() = user_id to ensure proper ownership
*/

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Public can view videos" ON videos;
DROP POLICY IF EXISTS "Public can create videos" ON videos;
DROP POLICY IF EXISTS "Public can update videos" ON videos;
DROP POLICY IF EXISTS "Public can delete videos" ON videos;

-- Create secure policies that restrict access to user's own videos
CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);