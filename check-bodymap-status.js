import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

async function checkBodymapStatus() {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-image-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId: '3e8ecff7306cb7ab8f6d92a7cb9cd9cb'
      })
    });

    const data = await response.json();
    console.log('Status do bodymap:', data.result?.state);

    if (data.result?.state === 'success' && data.result?.images?.length > 0) {
      console.log('✅ Bodymap pronto!');
      console.log('URL:', data.result.images[0]);
    } else {
      console.log('⏳ Ainda processando...');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkBodymapStatus();
