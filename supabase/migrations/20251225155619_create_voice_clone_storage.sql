/*
  # Create Voice Clone Storage Buckets

  1. Storage
    - Create `voice-clone-audios` bucket for voice cloning audio files
    - Create `voice-clone-prompts` bucket for prompt audio files
    - Create `tts-outputs` bucket for generated TTS audio files

  2. Security
    - Allow authenticated users to upload their own files
    - Allow public read access for audio files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('voice-clone-audios', 'voice-clone-audios', true),
  ('voice-clone-prompts', 'voice-clone-prompts', true),
  ('tts-outputs', 'tts-outputs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own voice clone audios"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-clone-audios' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read voice clone audios"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'voice-clone-audios');

CREATE POLICY "Users can delete own voice clone audios"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-clone-audios' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own prompt audios"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-clone-prompts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read prompt audios"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'voice-clone-prompts');

CREATE POLICY "Users can delete own prompt audios"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-clone-prompts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own TTS outputs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tts-outputs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read TTS outputs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tts-outputs');

CREATE POLICY "Users can delete own TTS outputs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tts-outputs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
