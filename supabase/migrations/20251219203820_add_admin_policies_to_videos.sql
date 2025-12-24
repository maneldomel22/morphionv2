/*
  # Add Admin Policies to Videos Table

  1. Changes
    - Add policy to allow admins to view all videos
    - Add policy to allow admins to update all videos
    - Add policy to allow admins to delete all videos

  2. Security
    - Admins can view, update, and delete all videos from all users
    - Regular users still only see their own videos
*/

-- Allow admins to view all videos
CREATE POLICY "Admins can view all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Allow admins to update all videos
CREATE POLICY "Admins can update all videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (true);

-- Allow admins to delete all videos
CREATE POLICY "Admins can delete all videos"
  ON videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );