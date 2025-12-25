/*
  # Update Cloned Voices Table

  1. Changes
    - Add missing columns to cloned_voices table
    - Add RLS policies if not exists
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'audio_file_id') THEN
    ALTER TABLE cloned_voices ADD COLUMN audio_file_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'prompt_audio_file_id') THEN
    ALTER TABLE cloned_voices ADD COLUMN prompt_audio_file_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'prompt_text') THEN
    ALTER TABLE cloned_voices ADD COLUMN prompt_text text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'demo_audio_url') THEN
    ALTER TABLE cloned_voices ADD COLUMN demo_audio_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'voice_status') THEN
    ALTER TABLE cloned_voices ADD COLUMN voice_status text DEFAULT 'processing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'error_message') THEN
    ALTER TABLE cloned_voices ADD COLUMN error_message text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloned_voices' AND column_name = 'metadata') THEN
    ALTER TABLE cloned_voices ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

ALTER TABLE cloned_voices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cloned voices" ON cloned_voices;
CREATE POLICY "Users can view own cloned voices"
  ON cloned_voices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cloned voices" ON cloned_voices;
CREATE POLICY "Users can insert own cloned voices"
  ON cloned_voices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cloned voices" ON cloned_voices;
CREATE POLICY "Users can update own cloned voices"
  ON cloned_voices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cloned voices" ON cloned_voices;
CREATE POLICY "Users can delete own cloned voices"
  ON cloned_voices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cloned_voices_user_id ON cloned_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_cloned_voices_voice_status ON cloned_voices(voice_status);
