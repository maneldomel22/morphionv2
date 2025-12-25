/*
  # Create TTS Tasks Table

  1. New Table
    - `tts_tasks` - Stores text-to-speech generation tasks

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS tts_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cloned_voice_id uuid REFERENCES cloned_voices(id) ON DELETE SET NULL,
  task_id text,
  file_id text,
  model text NOT NULL DEFAULT 'speech-2.6-hd',
  text text NOT NULL,
  audio_url text,
  task_status text NOT NULL DEFAULT 'queued',
  usage_characters integer,
  error_message text,
  audio_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tts_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own TTS tasks" ON tts_tasks;
CREATE POLICY "Users can view own TTS tasks"
  ON tts_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own TTS tasks" ON tts_tasks;
CREATE POLICY "Users can insert own TTS tasks"
  ON tts_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own TTS tasks" ON tts_tasks;
CREATE POLICY "Users can update own TTS tasks"
  ON tts_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own TTS tasks" ON tts_tasks;
CREATE POLICY "Users can delete own TTS tasks"
  ON tts_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tts_tasks_user_id ON tts_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_tasks_task_status ON tts_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_tts_tasks_cloned_voice_id ON tts_tasks(cloned_voice_id);
