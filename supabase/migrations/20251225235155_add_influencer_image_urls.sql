/*
  # Add profile_image_url and bodymap_url to influencers
  
  1. Changes
    - Add `profile_image_url` to store the generated profile photo URL
    - Add `bodymap_url` to store the generated bodymap reference URL
  
  2. Notes
    - These URLs are populated by the creation flow after KIE tasks complete
    - `profile_image_url` is also copied to `image_url` for display
*/

-- Add profile_image_url if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE influencers ADD COLUMN profile_image_url text;
  END IF;
END $$;

-- Add bodymap_url if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'bodymap_url'
  ) THEN
    ALTER TABLE influencers ADD COLUMN bodymap_url text;
  END IF;
END $$;
