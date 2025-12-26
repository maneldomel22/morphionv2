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

async function forceCreateBodymap() {
  try {
    console.log('🚀 Forçando criação do bodymap...');

    const response = await fetch(`${supabaseUrl}/functions/v1/process-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        influencer_id: 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13'
      })
    });

    const data = await response.json();
    console.log('✅ Resposta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

forceCreateBodymap();
