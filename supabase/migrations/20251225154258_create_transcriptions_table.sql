/*
  # Create Transcriptions Table

  1. New Tables
    - `transcriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `audio_url` (text) - URL do arquivo de áudio/vídeo no storage
      - `assembly_id` (text) - ID da transcrição no AssemblyAI
      - `status` (text) - Status: queued, processing, completed, failed
      - `text` (text) - Texto transcrito
      - `language_code` (text) - Código do idioma detectado
      - `audio_duration` (integer) - Duração em segundos
      - `words_count` (integer) - Número de palavras
      - `confidence` (float) - Confiança média da transcrição (0-1)
      - `speech_model_used` (text) - Modelo usado (universal, slam-1, etc)
      - `error_message` (text) - Mensagem de erro se falhou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `transcriptions` table
    - Add policies for authenticated users to manage their own transcriptions
*/

CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_url text NOT NULL,
  assembly_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  text text,
  language_code text,
  audio_duration integer,
  words_count integer,
  confidence float,
  speech_model_used text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
