/*
  # Add Identity Map Image URL to Influencers

  Adds a new column to store the identity map image (9-panel grid reference image).

  1. Changes
    - Add `identity_map_image_url` column to `influencers` table
      - Stores URL of the 9-panel identity grid image
      - Used as comprehensive physical reference for content generation
      - Nullable to maintain backwards compatibility

  2. Notes
    - The identity map is a detailed grid showing multiple views and body parts
    - Provides more comprehensive reference than single profile photo
    - Both `image_url` and `identity_map_image_url` can coexist
*/

-- Add identity map image URL column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'identity_map_image_url'
  ) THEN
    ALTER TABLE influencers ADD COLUMN identity_map_image_url text DEFAULT '';
  END IF;
END $$;