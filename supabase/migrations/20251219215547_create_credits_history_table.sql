/*
  # Create Credits History Table

  1. New Tables
    - `credits_history`
      - `id` (uuid, primary key) - unique record identifier
      - `user_id` (uuid, foreign key) - references profiles.id
      - `amount` (integer) - credit change amount (positive for additions, negative for deductions)
      - `balance_after` (integer) - user's credit balance after this transaction
      - `type` (text) - type of transaction (manual_add, manual_deduct, video_generation, image_generation, etc)
      - `description` (text) - transaction description/note
      - `created_at` (timestamptz) - timestamp of transaction

  2. Security
    - Enable RLS on credits_history
    - Users can only view their own credit history
    - Admins can view all credit history
    - Only system functions can insert/update records

  3. Indexes
    - Index on user_id for efficient queries
    - Index on created_at for time-based queries
*/

-- Create credits_history table
CREATE TABLE IF NOT EXISTS credits_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS credits_history_user_id_idx ON credits_history(user_id);
CREATE INDEX IF NOT EXISTS credits_history_created_at_idx ON credits_history(created_at DESC);
CREATE INDEX IF NOT EXISTS credits_history_user_created_idx ON credits_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE credits_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit history
CREATE POLICY "Users can view own credit history"
  ON credits_history FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Admins can view all credit history
CREATE POLICY "Admins can view all credit history"
  ON credits_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );