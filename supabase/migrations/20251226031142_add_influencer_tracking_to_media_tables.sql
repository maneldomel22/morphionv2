/*
  # Add Influencer Tracking to Media Tables
  
  1. Changes to `generated_images` table
    - Add `influencer_id` (uuid) - References influencers table
    - Add `image_type` (text) - Type of image: 'user_generated', 'influencer_profile', 'influencer_bodymap', 'influencer_post'
    
  2. Changes to `videos` table
    - Add `influencer_id` (uuid) - References influencers table
    - Add `video_type` (text) - Type of video: 'user_generated', 'influencer_presentation', 'influencer_post'
    
  3. Changes to `influencers` table
    - Add `profile_image_id` (uuid) - References generated_images
    - Add `bodymap_image_id` (uuid) - References generated_images
    - Add `presentation_video_id` (uuid) - References videos
    
  4. Security
    - RLS policies already cover these tables
    - Foreign keys ensure data integrity
*/

-- Add influencer tracking to generated_images
ALTER TABLE generated_images 
  ADD COLUMN IF NOT EXISTS influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS image_type text DEFAULT 'user_generated' CHECK (image_type IN ('user_generated', 'influencer_profile', 'influencer_bodymap', 'influencer_post'));

-- Add influencer tracking to videos
ALTER TABLE videos 
  ADD COLUMN IF NOT EXISTS influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'user_generated' CHECK (video_type IN ('user_generated', 'influencer_presentation', 'influencer_post'));

-- Add media references to influencers
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS profile_image_id uuid REFERENCES generated_images(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bodymap_image_id uuid REFERENCES generated_images(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS presentation_video_id uuid REFERENCES videos(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_images_influencer_id ON generated_images(influencer_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_image_type ON generated_images(image_type);
CREATE INDEX IF NOT EXISTS idx_videos_influencer_id ON videos(influencer_id);
CREATE INDEX IF NOT EXISTS idx_videos_video_type ON videos(video_type);