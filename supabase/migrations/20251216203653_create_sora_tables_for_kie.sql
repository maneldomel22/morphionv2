/*
  # Create Sora Tables for KIE Integration

  Creates the necessary tables for video generation with KIE API integration.

  ## New Tables
  - custom_avatars: User-created avatar definitions
  - projects: Video project configurations
  - videos: Generated videos with KIE API tracking
  - presets: Batch generation presets
*/

-- Create custom_avatars table
CREATE TABLE IF NOT EXISTS custom_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  gender text NOT NULL,
  age text NOT NULL,
  description text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own avatars" ON custom_avatars;
CREATE POLICY "Users can view own avatars"
  ON custom_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own avatars" ON custom_avatars;
CREATE POLICY "Users can create own avatars"
  ON custom_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own avatars" ON custom_avatars;
CREATE POLICY "Users can update own avatars"
  ON custom_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own avatars" ON custom_avatars;
CREATE POLICY "Users can delete own avatars"
  ON custom_avatars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'guided',
  avatar_data jsonb NOT NULL DEFAULT '{}',
  creative_style jsonb NOT NULL DEFAULT '{}',
  dialogue text NOT NULL DEFAULT '',
  format_settings jsonb NOT NULL DEFAULT '{}',
  product_data jsonb,
  scene_settings jsonb NOT NULL DEFAULT '{}',
  style_settings jsonb NOT NULL DEFAULT '{}',
  storyboard jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  thumbnail_url text NOT NULL,
  video_url text,
  status text NOT NULL DEFAULT 'processing',
  avatar_name text NOT NULL,
  avatar_gender text NOT NULL,
  duration text NOT NULL,
  aspect_ratio text NOT NULL,
  creative_style text NOT NULL,
  dialogue text NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  kie_task_id text,
  kie_model text,
  generation_mode text DEFAULT 'text-to-video',
  kie_fail_code text,
  kie_fail_message text,
  kie_prompt text,
  queued_at timestamptz,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own videos" ON videos;
CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own videos" ON videos;
CREATE POLICY "Users can create own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own videos" ON videos;
CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create presets table
CREATE TABLE IF NOT EXISTS presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_mode text NOT NULL,
  dialogue_mode text NOT NULL,
  quantity integer NOT NULL DEFAULT 5,
  ab_test_config jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own presets" ON presets;
CREATE POLICY "Users can view own presets"
  ON presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own presets" ON presets;
CREATE POLICY "Users can create own presets"
  ON presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own presets" ON presets;
CREATE POLICY "Users can update own presets"
  ON presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own presets" ON presets;
CREATE POLICY "Users can delete own presets"
  ON presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_kie_task_id ON videos(kie_task_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_status ON videos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_avatars_user_id ON custom_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);