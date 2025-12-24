/*
  # Create Folder Sharing System

  1. New Tables
    - `folder_shares`
      - `id` (uuid, primary key) - Unique identifier for the share
      - `folder_id` (uuid, foreign key) - Reference to the folder being shared
      - `owner_id` (uuid, foreign key) - User who owns/created the folder
      - `shared_with` (uuid, foreign key) - User who receives access
      - `created_at` (timestamptz) - When the share was created

  2. Security
    - Enable RLS on `folder_shares` table
    - Owner can create, read, and delete shares for their folders
    - Shared users can only read their own share records
    - No one else can access the data

  3. Indexes
    - Index on folder_id for fast lookups
    - Index on shared_with for user's shared folders list
*/

-- Create folder_shares table
CREATE TABLE IF NOT EXISTS folder_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES video_folders(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folder_shares_folder_id ON folder_shares(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_shares_shared_with ON folder_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_folder_shares_owner_id ON folder_shares(owner_id);

-- Add unique constraint to prevent duplicate shares
CREATE UNIQUE INDEX IF NOT EXISTS idx_folder_shares_unique ON folder_shares(folder_id, shared_with);

-- Enable RLS
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can view all shares for their folders
CREATE POLICY "Owners can view their folder shares"
  ON folder_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy: Shared users can view shares where they are the recipient
CREATE POLICY "Users can view shares they received"
  ON folder_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with);

-- Policy: Owner can create shares for their folders
CREATE POLICY "Owners can create folder shares"
  ON folder_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM video_folders
      WHERE video_folders.id = folder_id
      AND video_folders.user_id = auth.uid()
    )
  );

-- Policy: Owner can delete shares for their folders
CREATE POLICY "Owners can delete their folder shares"
  ON folder_shares
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create a function to check folder access (for use in application)
CREATE OR REPLACE FUNCTION check_folder_access(folder_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM video_folders
    WHERE id = folder_uuid
    AND user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has shared access
  IF EXISTS (
    SELECT 1 FROM folder_shares
    WHERE folder_id = folder_uuid
    AND shared_with = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;