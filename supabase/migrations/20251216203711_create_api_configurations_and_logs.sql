/*
  # Criar Tabelas de Configurações e Logs

  1. Nova Tabela `api_configurations`
    - Armazena credenciais e configurações de APIs externas
    - Campos:
      - `id` (uuid, primary key)
      - `service_name` (text) - Nome do serviço (ex: 'KIE')
      - `callback_url` (text) - URL para callbacks
      - `settings` (jsonb) - Configurações adicionais
      - `is_active` (boolean) - Se a configuração está ativa
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - RLS desabilitado (apenas edge functions acessam)

  2. Nova Tabela `video_generation_logs`
    - Registra todos os eventos de geração de vídeos
    - Campos:
      - `id` (uuid, primary key)
      - `video_id` (uuid) - Referência ao vídeo
      - `kie_task_id` (text) - ID da tarefa na KIE
      - `event_type` (text) - Tipo do evento
      - `event_data` (jsonb) - Dados do evento
      - `created_at` (timestamptz)
    - RLS habilitado (usuários veem apenas seus logs)
    - Índices para consultas rápidas

  3. Tipos de Eventos
    - 'request_sent' - Requisição enviada para KIE
    - 'callback_received' - Callback recebido da KIE
    - 'status_updated' - Status do vídeo atualizado
    - 'error_occurred' - Erro durante geração
    - 'polling_check' - Verificação manual de status
*/

CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  callback_url text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  kie_task_id text,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_video_id ON video_generation_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_logs_kie_task_id ON video_generation_logs(kie_task_id);
CREATE INDEX IF NOT EXISTS idx_logs_event_type ON video_generation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON video_generation_logs(created_at DESC);

ALTER TABLE video_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs of their own videos" ON video_generation_logs;
CREATE POLICY "Users can view logs of their own videos"
  ON video_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_generation_logs.video_id
      AND videos.user_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM api_configurations WHERE service_name = 'KIE'
  ) THEN
    INSERT INTO api_configurations (service_name, callback_url, settings)
    VALUES (
      'KIE',
      'https://selmogfyeujesrayxrhs.supabase.co/functions/v1/kie-callback',
      '{"api_url": "https://api.kie.ai/api/v1/jobs", "timeout": 600}'::jsonb
    );
  END IF;
END $$;