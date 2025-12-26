/*
  # Create Triggers for Automatic Influencer Media Updates
  
  1. New Triggers
    - `sync_influencer_profile_image` - Updates influencer profile_image_url when generated_images completes
    - `sync_influencer_bodymap` - Updates influencer bodymap_url when generated_images completes
    - `sync_influencer_presentation_video` - Updates influencer presentation_video_url when videos completes
    
  2. Functions
    - `update_influencer_from_image()` - Syncs completed images to influencers table
    - `update_influencer_from_video()` - Syncs completed videos to influencers table
    
  3. How it works
    - When a generated_image with influencer_id changes to 'completed', trigger fires
    - Function checks image_type and updates appropriate field in influencers table
    - Same logic for videos with 'ready' status
*/

-- Function to update influencer when image completes
CREATE OR REPLACE FUNCTION update_influencer_from_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to completed and has influencer_id
  IF NEW.status = 'completed' AND NEW.influencer_id IS NOT NULL AND NEW.image_url IS NOT NULL THEN

    -- Update profile image
    IF NEW.image_type = 'influencer_profile' THEN
      UPDATE influencers
      SET
        profile_image_url = NEW.image_url,
        profile_image_id = NEW.id,
        creation_status = CASE
          WHEN creation_status = 'creating_profile_image' THEN 'profile_ready_for_bodymap'
          ELSE creation_status
        END,
        updated_at = now()
      WHERE id = NEW.influencer_id;

      RAISE NOTICE 'Updated profile image for influencer % and transitioned to profile_ready_for_bodymap', NEW.influencer_id;

    -- Update bodymap
    ELSIF NEW.image_type = 'influencer_bodymap' THEN
      UPDATE influencers
      SET
        bodymap_url = NEW.image_url,
        bodymap_image_id = NEW.id,
        creation_status = CASE
          WHEN creation_status = 'creating_bodymap' THEN 'ready'
          ELSE creation_status
        END,
        updated_at = now()
      WHERE id = NEW.influencer_id;

      RAISE NOTICE 'Updated bodymap for influencer % and marked as ready', NEW.influencer_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update influencer when video completes
CREATE OR REPLACE FUNCTION update_influencer_from_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to ready and has influencer_id
  IF NEW.status = 'ready' AND NEW.influencer_id IS NOT NULL AND NEW.video_url IS NOT NULL THEN
    
    -- Update presentation video
    IF NEW.video_type = 'influencer_presentation' THEN
      UPDATE influencers
      SET 
        presentation_video_url = NEW.video_url,
        presentation_video_id = NEW.id,
        updated_at = now()
      WHERE id = NEW.influencer_id;
      
      RAISE NOTICE 'Updated presentation video for influencer %', NEW.influencer_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS sync_influencer_from_image ON generated_images;
CREATE TRIGGER sync_influencer_from_image
  AFTER INSERT OR UPDATE OF status, image_url ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_from_image();

DROP TRIGGER IF EXISTS sync_influencer_from_video ON videos;
CREATE TRIGGER sync_influencer_from_video
  AFTER INSERT OR UPDATE OF status, video_url ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_from_video();