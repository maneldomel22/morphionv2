/*
  # Create Sora 2 Video Generation Schema

  ## Overview
  This migration sets up the complete database schema for the Sora 2 video generation platform.
  It includes tables for user profiles, custom avatars, video projects, generated videos, and user presets.

  ## New Tables

  ### 1. profiles
  Stores user profile information and credit balance
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `credits` (integer) - Available credits for video generation
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. custom_avatars
  Stores custom avatars created by users
  - `id` (uuid, primary key) - Unique avatar identifier
  - `user_id` (uuid, foreign key) - Owner of the avatar
  - `name` (text) - Avatar name
  - `gender` (text) - Avatar gender
  - `age` (text) - Avatar age
  - `description` (text) - Physical appearance and personality description
  - `image_url` (text, nullable) - Optional custom image URL
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. projects
  Stores video project configurations before generation
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, foreign key) - Project owner
  - `name` (text) - Project name
  - `mode` (text) - Creation mode: 'guided' or 'autopilot'
  - `avatar_data` (jsonb) - Avatar configuration
  - `creative_style` (jsonb) - Creative style settings
  - `dialogue` (text) - Video dialogue/script
  - `format_settings` (jsonb) - Video format (aspect ratio, duration)
  - `product_data` (jsonb, nullable) - Product information
  - `scene_settings` (jsonb) - Scene and environment settings
  - `style_settings` (jsonb) - Camera and visual style settings
  - `storyboard` (jsonb, nullable) - Scene-by-scene breakdown
  - `status` (text) - Project status: 'draft', 'ready', 'generating'
  - `created_at` (timestamptz) - Project creation
  - `updated_at` (timestamptz) - Last modification

  ### 4. videos
  Stores generated videos and their metadata
  - `id` (uuid, primary key) - Unique video identifier
  - `user_id` (uuid, foreign key) - Video owner
  - `project_id` (uuid, foreign key, nullable) - Source project
  - `title` (text) - Video title
  - `thumbnail_url` (text) - Video thumbnail URL
  - `video_url` (text, nullable) - Generated video URL
  - `status` (text) - Generation status: 'processing', 'ready', 'error'
  - `avatar_name` (text) - Avatar used in video
  - `avatar_gender` (text) - Avatar gender
  - `duration` (text) - Video duration
  - `aspect_ratio` (text) - Video aspect ratio
  - `creative_style` (text) - Style used
  - `dialogue` (text) - Video script
  - `credits_used` (integer) - Credits consumed
  - `error_message` (text, nullable) - Error details if failed
  - `metadata` (jsonb) - Additional video metadata
  - `created_at` (timestamptz) - Generation start
  - `completed_at` (timestamptz, nullable) - Generation completion

  ### 5. presets
  Stores user-defined batch generation presets
  - `id` (uuid, primary key) - Unique preset identifier
  - `user_id` (uuid, foreign key) - Preset owner
  - `name` (text) - Preset name
  - `avatar_mode` (text) - Avatar variation mode
  - `dialogue_mode` (text) - Dialogue variation mode
  - `quantity` (integer) - Number of videos to generate
  - `ab_test_config` (jsonb, nullable) - A/B test settings
  - `created_at` (timestamptz) - Creation timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with policies ensuring:
  - Users can only access their own data
  - All operations require authentication
  - No public access to any user data

  ### Policies
  Each table has four policies:
  - SELECT: Users can view their own records
  - INSERT: Users can create records for themselves
  - UPDATE: Users can update their own records
  - DELETE: Users can delete their own records

  ## Notes
  - All timestamps use `timestamptz` for timezone awareness
  - UUIDs use `gen_random_uuid()` for automatic generation
  - JSONB fields allow flexible storage of complex configurations
  - Foreign keys maintain referential integrity
  - Default values prevent null errors and ensure data consistency
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  credits integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

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

CREATE POLICY "Users can view own avatars"
  ON custom_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own avatars"
  ON custom_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON custom_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can view own presets"
  ON presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own presets"
  ON presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_avatars_user_id ON custom_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
