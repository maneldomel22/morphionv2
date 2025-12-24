/*
  # Add Adult Content Support

  1. Changes
    - Document metadata field usage for adult content classification
    - No schema changes needed - using existing videos.metadata jsonb field

  2. Usage
    - Set metadata.content_type to 'adult' for hot influencer videos
    - Set metadata.mode to 'hot-influencer' to identify source

  3. Notes
    - App is 18+ by default, no age verification required
    - Adult content is artistic and tasteful
    - Separated from regular influencer content for organization
*/

-- No schema changes needed - metadata field already exists
-- This migration documents the adult content metadata structure

-- Create index for filtering adult content if needed
CREATE INDEX IF NOT EXISTS idx_videos_metadata_content_type
  ON videos USING gin((metadata -> 'content_type'));
