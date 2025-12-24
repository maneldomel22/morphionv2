/*
  # Fix Admin Policies Recursion

  1. Changes
    - Create a helper function to check if user is admin (avoids recursion)
    - Drop all existing policies from admins table
    - Create new secure policies using the helper function
    - Update videos policies to use the helper function

  2. Security
    - Admins can only see admin records (non-recursive)
    - Regular users cannot see admin records
    - Only admins can modify admin records
*/

-- Create helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()
  );
$$;

-- Drop all existing policies from admins table
DROP POLICY IF EXISTS "Allow users to view own admin record" ON admins;
DROP POLICY IF EXISTS "Only admins can view admins" ON admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON admins;

-- Create new non-recursive policies for admins table
CREATE POLICY "Admins can view all admin records"
  ON admins FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert admin records"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admin records"
  ON admins FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Drop and recreate videos policies to use the helper function
DROP POLICY IF EXISTS "Admins can view all videos" ON videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON videos;
DROP POLICY IF EXISTS "Admins can delete all videos" ON videos;

CREATE POLICY "Admins can view all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (true);

CREATE POLICY "Admins can delete all videos"
  ON videos FOR DELETE
  TO authenticated
  USING (public.is_admin());