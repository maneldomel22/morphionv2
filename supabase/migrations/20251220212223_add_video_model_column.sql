/*
  # Add video_model Column to Videos Table
  
  Adds the video_model column to track which AI model was used to generate each video.
  
  1. Changes
    - Add `video_model` (text, nullable) to `videos` table
    - Create index on video_model for better query performance
    - Update existing records with default value based on generation_mode
  
  2. Notes
    - Existing WAN videos will be updated to 'wan_2_5'
    - Future videos will store the model identifier (e.g., 'wan_2_5', 'veo3', 'sora2')
*/

-- Add video_model column to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'video_model'
  ) THEN
    ALTER TABLE videos ADD COLUMN video_model text;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_video_model ON videos(video_model);

-- Update existing records based on generation_mode
UPDATE videos 
SET video_model = 'wan_2_5' 
WHERE generation_mode = 'image-to-video' AND video_model IS NULL;

UPDATE videos 
SET video_model = 'veo3' 
WHERE generation_mode = 'text-to-video' AND video_model IS NULL;