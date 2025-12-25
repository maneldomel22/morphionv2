import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncInfluencerImages() {
  console.log('🔄 Sincronizando image_url das influencers...\n');

  try {
    // Buscar influencers que têm profile_image_url mas não têm image_url
    const { data: influencers, error: fetchError } = await supabase
      .from('influencers')
      .select('*')
      .not('profile_image_url', 'is', null)
      .or('image_url.is.null,image_url.eq.');

    if (fetchError) {
      throw fetchError;
    }

    if (!influencers || influencers.length === 0) {
      console.log('✅ Todas as influencers já estão sincronizadas!');
      return;
    }

    console.log(`📋 Encontradas ${influencers.length} influencer(s) para sincronizar:\n`);

    for (const influencer of influencers) {
      console.log(`\n🔄 Atualizando: ${influencer.name}`);
      console.log(`   ID: ${influencer.id}`);
      console.log(`   Profile Image: ${influencer.profile_image_url}`);
      console.log(`   Current Image: ${influencer.image_url || 'null'}`);

      const { error: updateError } = await supabase
        .from('influencers')
        .update({ image_url: influencer.profile_image_url })
        .eq('id', influencer.id);

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
      } else {
        console.log(`   ✅ Atualizada com sucesso!`);
      }
    }

    console.log('\n\n✅ Sincronização concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

syncInfluencerImages();
