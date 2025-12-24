import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function fixInfluencerImages() {
  console.log('🔍 Procurando influencers com image_url = "generating"...\n');

  const { data: influencers, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('image_url', 'generating');

  if (error) {
    console.error('❌ Erro ao buscar influencers:', error);
    return;
  }

  if (!influencers || influencers.length === 0) {
    console.log('✅ Nenhum influencer com status "generating" encontrado.');
    return;
  }

  console.log(`📋 Encontrados ${influencers.length} influencers para corrigir:\n`);

  for (const influencer of influencers) {
    console.log(`\n🔄 Processando: ${influencer.name} (@${influencer.username})`);
    console.log(`   ID: ${influencer.id}`);
    console.log(`   Criado em: ${new Date(influencer.created_at).toLocaleString()}`);

    const { data: images, error: imagesError } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', influencer.user_id)
      .eq('status', 'completed')
      .gte('created_at', influencer.created_at)
      .order('created_at', { ascending: false })
      .limit(5);

    if (imagesError) {
      console.error(`   ❌ Erro ao buscar imagens: ${imagesError.message}`);
      continue;
    }

    if (!images || images.length === 0) {
      console.log('   ⚠️  Nenhuma imagem gerada encontrada - marcando como erro');

      const { error: updateError } = await supabase
        .from('influencers')
        .update({ image_url: 'error' })
        .eq('id', influencer.id);

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
      } else {
        console.log('   ✅ Status atualizado para "error"');
      }
      continue;
    }

    console.log(`   📸 Encontradas ${images.length} imagens geradas após criação do influencer`);

    const latestImage = images[0];
    console.log(`   🎯 Usando imagem mais recente: ${latestImage.output_images[0].substring(0, 60)}...`);

    const { error: updateError } = await supabase
      .from('influencers')
      .update({
        image_url: latestImage.output_images[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', influencer.id);

    if (updateError) {
      console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
    } else {
      console.log('   ✅ Imagem atualizada com sucesso!');
    }
  }

  console.log('\n✨ Processo concluído!');
}

fixInfluencerImages().catch(console.error);
