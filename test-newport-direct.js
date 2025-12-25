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

const NEWPORT_API_KEY = env.NEWPORT_API_KEY;

async function testNewportDirect() {
  console.log('🧪 Testando API Newport diretamente...\n');

  // Test URLs from the documentation
  const srcVideoUrl = 'https://dreamface-resource-aigc.oss-us-east-1.aliyuncs.com/apiDocsAdmin/2025-4-1744792006191-video_demo.mp4';
  const audioUrl = 'https://dreamface-resource-aigc.oss-us-east-1.aliyuncs.com/apiDocsAdmin/2025-4-1744792051941-audio_demo.mp3';

  console.log('Configuração:');
  console.log(`  - API Key: ${NEWPORT_API_KEY ? `${NEWPORT_API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADA'}`);
  console.log(`  - Video URL: ${srcVideoUrl}`);
  console.log(`  - Audio URL: ${audioUrl}\n`);

  if (!NEWPORT_API_KEY) {
    console.error('❌ NEWPORT_API_KEY não está configurada no .env');
    return;
  }

  try {
    console.log('1. Iniciando LipSync na API Newport...\n');

    const requestBody = {
      srcVideoUrl,
      audioUrl,
      videoParams: {
        video_width: 0,
        video_height: 0,
        video_enhance: 1,
        fps: 'original',
      },
    };

    console.log('Request Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await fetch('https://api.newportai.com/api/async/lipsync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEWPORT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    console.log('Response Body:');
    console.log(responseText);
    console.log('');

    if (!response.ok) {
      console.error('❌ Erro na requisição HTTP');
      return;
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      console.error(`❌ Erro da API Newport: ${data.message || 'Desconhecido'}`);
      return;
    }

    console.log('✓ LipSync iniciado com sucesso!');
    console.log(`  - Task ID: ${data.data.taskId}\n`);

    // Poll for status
    console.log('2. Verificando status (polling)...\n');

    let attempts = 0;
    const maxAttempts = 60; // 5 minutos

    while (attempts < maxAttempts) {
      attempts++;

      await new Promise(resolve => setTimeout(resolve, 5000));

      const pollingResponse = await fetch('https://api.newportai.com/api/getAsyncResult', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEWPORT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: data.data.taskId,
        }),
      });

      const pollingText = await pollingResponse.text();

      if (!pollingText) {
        console.log('  - Status: Ainda processando (resposta vazia)');
        continue;
      }

      const pollingData = JSON.parse(pollingText);

      console.log(`Tentativa ${attempts}/${maxAttempts}`);
      console.log(JSON.stringify(pollingData, null, 2));
      console.log('');

      if (pollingData.code !== 0) {
        console.error(`❌ Erro no polling: ${pollingData.message}`);
        break;
      }

      // Check task status: 1=submitted, 2=processing, 3=success, 4=failed
      const taskStatus = pollingData.data?.task?.status;
      const taskReason = pollingData.data?.task?.reason || '';

      if (taskStatus === 3) {
        // Task completed successfully
        if (pollingData.data?.videos && pollingData.data.videos.length > 0) {
          console.log('✓ LipSync concluído!');
          console.log(`  - Video URL: ${pollingData.data.videos[0].videoUrl}\n`);
          break;
        }
      }

      if (taskStatus === 4) {
        // Task failed
        console.error(`❌ LipSync falhou: ${taskReason || 'Desconhecido'}\n`);
        break;
      }

      // Status 1 (submitted) or 2 (processing) - still processing
      console.log(`  - Status: Processando (status=${taskStatus})`);
    }

    if (attempts >= maxAttempts) {
      console.log('⚠ Timeout após 5 minutos\n');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  }
}

testNewportDirect();
