/*
  # Create Timeline Editor Schema

  1. New Tables
    - `timeline_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `timeline_data` (jsonb) - Full timeline JSON
      - `thumbnail_url` (text, nullable)
      - `duration` (numeric) - Duration in seconds
      - `width` (integer) - Video width
      - `height` (integer) - Video height
      - `fps` (integer) - Frames per second
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `render_jobs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references timeline_projects)
      - `user_id` (uuid, references auth.users)
      - `status` (text) - queued, processing, completed, failed
      - `progress` (integer) - 0-100
      - `output_url` (text, nullable)
      - `error_message` (text, nullable)
      - `started_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their own data
*/

-- Timeline Projects Table
CREATE TABLE IF NOT EXISTS timeline_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  timeline_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text,
  duration numeric DEFAULT 0,
  width integer DEFAULT 1920,
  height integer DEFAULT 1080,
  fps integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline projects"
  ON timeline_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create timeline projects"
  ON timeline_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline projects"
  ON timeline_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline projects"
  ON timeline_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Render Jobs Table
CREATE TABLE IF NOT EXISTS render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES timeline_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  progress integer DEFAULT 0,
  output_url text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own render jobs"
  ON render_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create render jobs"
  ON render_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own render jobs"
  ON render_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_projects_user_id ON timeline_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_projects_created_at ON timeline_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project_id ON render_jobs(project_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_timeline_projects_updated_at
  BEFORE UPDATE ON timeline_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
