/*
  # Add Bad Mode Support to Morphy Conversations

  1. Changes
    - Add `is_bad_mode` column to `morphy_conversations` table
    - This allows each conversation to track whether it was created in Bad Mode
    - Conversations will be filtered by mode in the UI

  2. Notes
    - Defaults to false (normal mode)
    - Existing conversations will be marked as normal mode
    - No breaking changes to existing functionality
*/

-- Add is_bad_mode column to morphy_conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'morphy_conversations' AND column_name = 'is_bad_mode'
  ) THEN
    ALTER TABLE morphy_conversations
    ADD COLUMN is_bad_mode boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for filtering conversations by mode
CREATE INDEX IF NOT EXISTS idx_morphy_conversations_bad_mode
ON morphy_conversations(user_id, is_bad_mode, updated_at DESC);
