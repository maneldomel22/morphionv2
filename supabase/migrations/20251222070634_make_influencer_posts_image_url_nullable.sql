/*
  # Make image_url nullable in influencer_posts

  Allows posts to be created with status 'generating' before image generation completes.

  ## Changes
    - Alter `image_url` column in `influencer_posts` to allow NULL values
    - Posts can now be created without an image_url initially
    - Image URL will be populated when generation completes via callback
*/

-- Make image_url nullable in influencer_posts
ALTER TABLE influencer_posts 
ALTER COLUMN image_url DROP NOT NULL;
