import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env manualmente
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const KIE_API_KEY = '0a30cb34de4ec530f2d30fd705fe982f';
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMayaProfileImage() {
  const taskId = '4d31e9508aa45e993700e842057a45e2';
  const influencerId = 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13';

  console.log('🔍 Buscando imagem do KIE...');

  // Buscar status da task no KIE
  const response = await fetch('https://api.kie.so/getVideo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ taskId })
  });

  const data = await response.json();
  console.log('📦 Resposta do KIE:', JSON.stringify(data, null, 2));

  if (data.status === 'completed' && data.url) {
    console.log('✅ Imagem pronta:', data.url);

    // Atualizar no banco
    const { data: updateData, error } = await supabase
      .from('influencers')
      .update({
        profile_image_url: data.url,
        creation_status: 'creating_bodymap',
        updated_at: new Date().toISOString()
      })
      .eq('id', influencerId);

    if (error) {
      console.error('❌ Erro ao atualizar:', error);
    } else {
      console.log('✅ Perfil atualizado! Avançando para criar bodymap...');
    }
  } else {
    console.log('⏳ Imagem ainda não está pronta. Status:', data.status);
  }
}

updateMayaProfileImage().catch(console.error);
