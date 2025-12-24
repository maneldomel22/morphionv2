/*
  # Add Mode and Post Type Fields to Influencer Tables

  This migration adds missing fields for SAFE/HOT mode management and video post support.

  ## Changes to influencers table
    - Add `mode` column ('safe' or 'hot') with default 'safe'
    - Add `profile_image_url` column (alias/reference to existing image_url)

  ## Changes to influencer_posts table
    - Add `type` column ('image' or 'video') with default 'image'
    - Add `video_url` column (nullable, for video posts)
    - Add `engine_used` column (tracks which AI engine generated the content)
    - Add `mode` column ('safe' or 'hot') with default 'safe'

  ## Notes
    - All existing influencers will default to 'safe' mode
    - All existing posts will default to 'image' type
    - Video posts will use video_url field instead of image_url
*/

-- Add mode column to influencers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'mode'
  ) THEN
    ALTER TABLE influencers ADD COLUMN mode text NOT NULL DEFAULT 'safe' CHECK (mode IN ('safe', 'hot'));
  END IF;
END $$;

-- Add type column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'type'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN type text NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video'));
  END IF;
END $$;

-- Add video_url column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN video_url text;
  END IF;
END $$;

-- Add engine_used column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'engine_used'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN engine_used text;
  END IF;
END $$;

-- Add mode column to influencer_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_posts' AND column_name = 'mode'
  ) THEN
    ALTER TABLE influencer_posts ADD COLUMN mode text NOT NULL DEFAULT 'safe' CHECK (mode IN ('safe', 'hot'));
  END IF;
END $$;

-- Create index on mode for filtering
CREATE INDEX IF NOT EXISTS idx_influencers_mode ON influencers(mode);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_mode ON influencer_posts(mode);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_type ON influencer_posts(type);