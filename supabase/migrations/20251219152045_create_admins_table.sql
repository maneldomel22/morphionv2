/*
  # Create Admins Table

  1. New Tables
    - `admins`
      - `id` (uuid, primary key) - references auth.users
      - `email` (text, not null, unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on admins table
    - Only admins can view admins table

  3. Important Notes
    - This table stores admin user IDs
    - Must be manually populated with admin user IDs
    - Foreign key constraint ensures admin users exist in auth.users
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view admins table
CREATE POLICY "Only admins can view admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Only admins can insert into admins table
CREATE POLICY "Only admins can insert admins"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Only admins can delete from admins table
CREATE POLICY "Only admins can delete admins"
  ON admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);