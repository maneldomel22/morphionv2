/*
  # Add Status and Metadata to Influencer Posts

  This migration adds tracking fields for post generation status and metadata.

  ## Changes to influencer_posts table
    - Add `status` column ('generating', 'completed', 'failed') with default 'generating'
    - Add `metadata` jsonb column to store taskId and other generation details
    - Add `error_message` text column for failure tracking

  ## Notes
    - All existing posts will default to 'completed' status (assumed done)
    - Metadata column allows flexible storage of generation tracking info
    - Error messages help with debugging failed generations
*/

-- Add status column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE influencer_posts
    ADD COLUMN status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('generating', 'completed', 'failed'));
  END IF;
END $$;

-- Add metadata column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add error_message column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN error_message text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_influencer_posts_status ON influencer_posts(status);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_metadata ON influencer_posts USING gin(metadata);
