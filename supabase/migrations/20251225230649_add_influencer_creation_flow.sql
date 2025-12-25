/*
  # Add Influencer Creation Flow Fields

  1. Changes to `influencers` table
    - Add `creation_status` field to track creation progress
    - Add `intro_video_url` for the presentation video
    - Add `intro_video_task_id` for tracking video generation
    - Add `reference_frame_url` for the extracted frame
    - Add `profile_image_task_id` for tracking profile image generation
    - Add `bodymap_task_id` for tracking bodymap generation
    - Add `creation_metadata` for storing creation flow data
    
  2. Status Flow
    - creating_video: Generating intro video
    - extracting_frame: Extracting reference frame from video
    - creating_profile_image: Generating profile photo
    - creating_bodymap: Generating body map
    - optimizing_identity: Final optimization
    - ready: Influencer ready to use
    - failed: Creation failed
*/

-- Add creation flow fields to influencers table
DO $$
BEGIN
  -- Add creation_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'creation_status'
  ) THEN
    ALTER TABLE influencers ADD COLUMN creation_status text DEFAULT 'ready';
    ALTER TABLE influencers ADD CONSTRAINT check_creation_status 
      CHECK (creation_status IN (
        'creating_video',
        'extracting_frame', 
        'creating_profile_image',
        'creating_bodymap',
        'optimizing_identity',
        'ready',
        'failed'
      ));
  END IF;

  -- Add intro_video_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'intro_video_url'
  ) THEN
    ALTER TABLE influencers ADD COLUMN intro_video_url text;
  END IF;

  -- Add intro_video_task_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'intro_video_task_id'
  ) THEN
    ALTER TABLE influencers ADD COLUMN intro_video_task_id text;
  END IF;

  -- Add reference_frame_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'reference_frame_url'
  ) THEN
    ALTER TABLE influencers ADD COLUMN reference_frame_url text;
  END IF;

  -- Add profile_image_task_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'profile_image_task_id'
  ) THEN
    ALTER TABLE influencers ADD COLUMN profile_image_task_id text;
  END IF;

  -- Add bodymap_task_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'bodymap_task_id'
  ) THEN
    ALTER TABLE influencers ADD COLUMN bodymap_task_id text;
  END IF;

  -- Add creation_metadata if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'creation_metadata'
  ) THEN
    ALTER TABLE influencers ADD COLUMN creation_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;