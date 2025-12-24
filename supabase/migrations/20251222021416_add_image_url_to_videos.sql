/*
  # Add image_url column to videos table

  1. Changes
    - Add `image_url` column to `videos` table to store the source image URL for image-to-video generations
    - This allows variations to reuse the same source image as the base video

  2. Notes
    - Column is nullable since not all videos are image-to-video
    - Text type to store full URLs
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE videos ADD COLUMN image_url text;
  END IF;
END $$;
