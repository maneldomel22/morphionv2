import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env file
const envFile = readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLipSync() {
  console.log('🧪 Testando integração Newport LipSync...\n');

  // Test URLs from the documentation
  const srcVideoUrl = 'https://dreamface-resource-aigc.oss-us-east-1.aliyuncs.com/apiDocsAdmin/2025-4-1744792006191-video_demo.mp4';
  const audioUrl = 'https://dreamface-resource-aigc.oss-us-east-1.aliyuncs.com/apiDocsAdmin/2025-4-1744792051941-audio_demo.mp3';

  try {
    // 1. Sign in as admin
    console.log('1. Fazendo login como admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'matheusbessa.tech@gmail.com',
      password: 'bct123',
    });

    if (authError) {
      throw new Error(`Erro ao fazer login: ${authError.message}`);
    }

    console.log('✓ Login bem-sucedido\n');

    // 2. Call start-lipsync function
    console.log('2. Chamando start-lipsync Edge Function...');
    console.log(`   - Video: ${srcVideoUrl}`);
    console.log(`   - Audio: ${audioUrl}\n`);

    const startResponse = await fetch(`${supabaseUrl}/functions/v1/start-lipsync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        srcVideoUrl,
        audioUrl,
        videoParams: {
          video_width: 0,
          video_height: 0,
          video_enhance: 1,
          fps: 'original',
        },
      }),
    });

    const startData = await startResponse.json();

    console.log('Resposta do start-lipsync:');
    console.log(JSON.stringify(startData, null, 2));
    console.log('');

    if (!startResponse.ok || !startData.success) {
      throw new Error(`Erro ao iniciar LipSync: ${startData.error || 'Desconhecido'}`);
    }

    console.log('✓ LipSync iniciado com sucesso!');
    console.log(`  - Task ID: ${startData.taskId}`);
    console.log(`  - Newport Task ID: ${startData.newportTaskId}\n`);

    // 3. Poll for status
    console.log('3. Verificando status do LipSync...\n');

    let attempts = 0;
    const maxAttempts = 60; // 5 minutos (5 segundos * 60)

    while (attempts < maxAttempts) {
      attempts++;

      const statusResponse = await fetch(`${supabaseUrl}/functions/v1/check-lipsync-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          taskId: startData.taskId,
        }),
      });

      const statusData = await statusResponse.json();

      console.log(`Tentativa ${attempts}/${maxAttempts} - Status: ${statusData.status}`);

      if (statusData.status === 'completed') {
        console.log('\n✓ LipSync concluído com sucesso!');
        console.log(`  - Video URL: ${statusData.resultVideoUrl}\n`);
        break;
      } else if (statusData.status === 'failed') {
        console.log('\n✗ LipSync falhou!');
        console.log(`  - Erro: ${statusData.errorMessage}\n`);
        break;
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (attempts >= maxAttempts) {
      console.log('\n⚠ Timeout: LipSync ainda está processando após 5 minutos\n');
    }

    // 4. Check database
    console.log('4. Verificando registro no banco de dados...\n');
    const { data: taskData, error: taskError } = await supabase
      .from('lipsync_tasks')
      .select('*')
      .eq('id', startData.taskId)
      .single();

    if (taskError) {
      console.log(`✗ Erro ao buscar task: ${taskError.message}\n`);
    } else {
      console.log('✓ Task encontrada no banco:');
      console.log(JSON.stringify(taskData, null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error(error);
  }
}

testLipSync();
