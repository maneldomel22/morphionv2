import { createClient } from '@supabase/supabase-js';
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

async function fetchMayaImage() {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-image-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId: '4d31e9508aa45e993700e842057a45e2'
      })
    });

    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

fetchMayaImage();
