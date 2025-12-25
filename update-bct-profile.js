import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function updateBCTProfile() {
  console.log('🔍 Buscando influencer BCT ou Aninha...\n');

  const { data: influencers, error: searchError } = await supabase
    .from('influencers')
    .select('*')
    .or('name.ilike.%bct%,name.ilike.%aninha%');

  if (searchError) {
    console.error('Erro ao buscar influencer:', searchError);
    return;
  }

  if (influencers && influencers.length > 0) {
    console.log(`✅ Encontrada influencer: ${influencers[0].name} (ID: ${influencers[0].id})`);
    console.log(`📷 URL atual: ${influencers[0].image_url}\n`);

    const newProfileUrl = 'https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1.png';

    const { data: updated, error: updateError } = await supabase
      .from('influencers')
      .update({ image_url: newProfileUrl })
      .eq('id', influencers[0].id)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return;
    }

    console.log('✅ Foto de perfil atualizada!');
    console.log(`📷 Nova URL: ${newProfileUrl}\n`);
  } else {
    console.log('ℹ️ Nenhuma influencer BCT/Aninha encontrada.');
    console.log('As novas imagens de referência BCT já estão configuradas no código.');
    console.log('Quando você criar uma nova influencer no modo HOT, as 6 novas imagens serão usadas automaticamente.\n');
  }

  console.log('📋 URLs das novas imagens BCT de referência:');
  console.log('1. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1.png');
  console.log('2. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1_copiar.png');
  console.log('3. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1_copiar_2.png');
  console.log('4. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1_copiar_3.png');
  console.log('5. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1_copiar_4.png');
  console.log('6. https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/reference-images/bct/prancheta_1_copiar_5.png');
}

updateBCTProfile().catch(console.error);
