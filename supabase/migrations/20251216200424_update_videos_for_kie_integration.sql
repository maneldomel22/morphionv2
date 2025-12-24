/*
  # Atualizar Tabela Videos para Integração KIE API

  1. Alterações na Tabela `videos`
    - Adiciona `kie_task_id` (text) - ID da tarefa na KIE API
    - Adiciona `kie_model` (text) - Modelo usado (sora-2-text-to-video ou sora-2-image-to-video)
    - Adiciona `generation_mode` (text) - Modo de geração (text-to-video ou image-to-video)
    - Adiciona `kie_fail_code` (text) - Código de erro da KIE
    - Adiciona `kie_fail_message` (text) - Mensagem de erro detalhada
    - Adiciona `kie_prompt` (text) - Prompt estruturado enviado para KIE
    - Modifica `status` para incluir novos estados
    - Cria índice em `kie_task_id` para consultas rápidas

  2. Notas Importantes
    - Status possíveis: 'queued', 'processing', 'ready', 'failed'
    - O campo kie_task_id permite rastrear o status na API externa
    - O campo kie_prompt armazena o prompt completo para debugging e reprocessamento
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'kie_task_id'
  ) THEN
    ALTER TABLE videos ADD COLUMN kie_task_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'kie_model'
  ) THEN
    ALTER TABLE videos ADD COLUMN kie_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'generation_mode'
  ) THEN
    ALTER TABLE videos ADD COLUMN generation_mode text DEFAULT 'text-to-video';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'kie_fail_code'
  ) THEN
    ALTER TABLE videos ADD COLUMN kie_fail_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'kie_fail_message'
  ) THEN
    ALTER TABLE videos ADD COLUMN kie_fail_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'kie_prompt'
  ) THEN
    ALTER TABLE videos ADD COLUMN kie_prompt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'queued_at'
  ) THEN
    ALTER TABLE videos ADD COLUMN queued_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_kie_task_id ON videos(kie_task_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_user_status ON videos(user_id, status);