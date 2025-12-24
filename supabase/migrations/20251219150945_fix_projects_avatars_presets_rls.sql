/*
  # Fix RLS Policies for Projects, Custom Avatars, and Presets Tables

  1. Security Changes - Projects Table
    - Drop existing insecure policies that allow public access
    - Create new restrictive policies for user-owned projects only
  
  2. Security Changes - Custom Avatars Table
    - Drop existing insecure policies that allow public access
    - Create new restrictive policies for user-owned avatars only
  
  3. Security Changes - Presets Table
    - Drop existing insecure policies that allow public access
    - Create new restrictive policies for user-owned presets only
  
  4. Important Notes
    - Critical security fix to prevent data leakage between users
    - All policies now verify auth.uid() = user_id for proper ownership
*/

-- Fix Projects table policies
DROP POLICY IF EXISTS "Public can view projects" ON projects;
DROP POLICY IF EXISTS "Public can create projects" ON projects;
DROP POLICY IF EXISTS "Public can update projects" ON projects;
DROP POLICY IF EXISTS "Public can delete projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix Custom Avatars table policies
DROP POLICY IF EXISTS "Public can view avatars" ON custom_avatars;
DROP POLICY IF EXISTS "Public can create avatars" ON custom_avatars;
DROP POLICY IF EXISTS "Public can update avatars" ON custom_avatars;
DROP POLICY IF EXISTS "Public can delete avatars" ON custom_avatars;

CREATE POLICY "Users can view own avatars"
  ON custom_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own avatars"
  ON custom_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON custom_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON custom_avatars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix Presets table policies
DROP POLICY IF EXISTS "Public can view presets" ON presets;
DROP POLICY IF EXISTS "Public can create presets" ON presets;
DROP POLICY IF EXISTS "Public can update presets" ON presets;
DROP POLICY IF EXISTS "Public can delete presets" ON presets;

CREATE POLICY "Users can view own presets"
  ON presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own presets"
  ON presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);