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

async function checkAninha() {
  console.log('🔍 Procurando ANINHA PRIV...\n');

  const { data: influencer, error } = await supabase
    .from('influencers')
    .select('*')
    .ilike('name', '%ANINHA%')
    .maybeSingle();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  if (!influencer) {
    console.log('❌ ANINHA PRIV não encontrada no banco');
    return;
  }

  console.log('✅ Influencer encontrada:');
  console.log('   ID:', influencer.id);
  console.log('   Nome:', influencer.name);
  console.log('   Username:', influencer.username);
  console.log('   User ID:', influencer.user_id);
  console.log('   Image URL:', influencer.image_url);
  console.log('   Criado em:', new Date(influencer.created_at).toLocaleString());
  console.log('   Atualizado em:', new Date(influencer.updated_at).toLocaleString());

  console.log('\n🔍 Procurando imagens geradas para este usuário...\n');

  const { data: images, error: imagesError } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', influencer.user_id)
    .gte('created_at', influencer.created_at)
    .order('created_at', { ascending: false });

  if (imagesError) {
    console.error('❌ Erro ao buscar imagens:', imagesError);
    return;
  }

  if (!images || images.length === 0) {
    console.log('⚠️  Nenhuma imagem encontrada na tabela generated_images');
    console.log('\nVou verificar se existe task_id na tabela...\n');

    const { data: allImages } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', influencer.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (allImages && allImages.length > 0) {
      console.log(`📋 Últimas ${allImages.length} imagens do usuário:`);
      allImages.forEach((img, idx) => {
        console.log(`\n   ${idx + 1}. Task ID: ${img.task_id}`);
        console.log(`      Status: ${img.status}`);
        console.log(`      Criado em: ${new Date(img.created_at).toLocaleString()}`);
        console.log(`      Output: ${img.output_images?.[0]?.substring(0, 60)}...`);
      });
    }
    return;
  }

  console.log(`✅ Encontradas ${images.length} imagens:\n`);

  images.forEach((img, idx) => {
    console.log(`   ${idx + 1}. Task ID: ${img.task_id}`);
    console.log(`      Status: ${img.status}`);
    console.log(`      Engine: ${img.image_engine}`);
    console.log(`      Influencer ID: ${img.influencer_id || 'não definido'}`);
    console.log(`      Criado em: ${new Date(img.created_at).toLocaleString()}`);
    if (img.output_images && img.output_images.length > 0) {
      console.log(`      URL: ${img.output_images[0].substring(0, 80)}...`);
    }
    console.log('');
  });

  const completedImage = images.find(img => img.status === 'completed' && img.output_images?.[0]);

  if (completedImage) {
    console.log('🎯 Imagem completa encontrada! Atualizando influencer...\n');

    const { data: updated, error: updateError } = await supabase
      .from('influencers')
      .update({
        image_url: completedImage.output_images[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', influencer.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
    } else {
      console.log('✅ ANINHA PRIV atualizada com sucesso!');
      console.log('   Nova URL:', updated.image_url.substring(0, 80) + '...');
    }
  } else {
    console.log('⚠️  Nenhuma imagem completa disponível ainda');
  }
}

checkAninha().catch(console.error);
