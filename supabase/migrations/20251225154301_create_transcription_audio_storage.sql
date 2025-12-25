/*
  # Create Transcription Audio Storage

  1. Storage
    - Create `transcription-audios` bucket for audio/video files

  2. Security
    - Allow authenticated users to upload their own files
    - Allow public read access for processing by AssemblyAI
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('transcription-audios', 'transcription-audios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transcription-audios' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read audio files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'transcription-audios');

CREATE POLICY "Users can delete own audio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transcription-audios' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
