/*
  # Add influencer_id to generated_images table
  
  Links generated images to influencer profiles:
  
  1. Changes to generated_images table
    - Add `influencer_id` (uuid, nullable, foreign key to influencers)
    - This allows tracking which images belong to which influencer
  
  2. Security
    - No RLS changes needed - existing policies cover this
*/

-- Add influencer_id to generated_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_images' AND column_name = 'influencer_id'
  ) THEN
    ALTER TABLE generated_images 
    ADD COLUMN influencer_id uuid REFERENCES influencers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_generated_images_influencer_id 
ON generated_images(influencer_id);