/*
  # Create Influencer Management Tables
  
  Creates tables for organizing influencer profiles and their posts.
  
  1. New Tables
    - `influencers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Display name of the influencer
      - `username` (text) - Instagram-style username without @
      - `image_url` (text) - Profile picture URL
      - `bio` (text, nullable) - Bio/description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `influencer_posts`
      - `id` (uuid, primary key)
      - `influencer_id` (uuid, foreign key to influencers)
      - `user_id` (uuid, foreign key to auth.users)
      - `image_url` (text) - Post image URL
      - `caption` (text) - Post caption/legend
      - `hashtags` (text, nullable) - Post hashtags
      - `aspect_ratio` (text) - Image format (feed/square/story)
      - `resolution` (text) - Image resolution
      - `prompt` (text, nullable) - Generation prompt used
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own influencers and posts
*/

-- Create influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text NOT NULL,
  image_url text NOT NULL,
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create influencer_posts table
CREATE TABLE IF NOT EXISTS influencer_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  hashtags text DEFAULT '',
  aspect_ratio text NOT NULL DEFAULT '9:16',
  resolution text NOT NULL DEFAULT '2K',
  prompt text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for influencers
CREATE POLICY "Users can view own influencers"
  ON influencers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own influencers"
  ON influencers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own influencers"
  ON influencers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own influencers"
  ON influencers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for influencer_posts
CREATE POLICY "Users can view own posts"
  ON influencer_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON influencer_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON influencer_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON influencer_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_influencer_id ON influencer_posts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_user_id ON influencer_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_posts_created_at ON influencer_posts(created_at DESC);