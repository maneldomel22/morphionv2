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

async function checkRecentImages() {
  console.log('🔍 Verificando últimas imagens geradas...\n');

  const { data: images, error } = await supabase
    .from('generated_images')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  if (!images || images.length === 0) {
    console.log('✅ Nenhuma imagem encontrada');
    return;
  }

  console.log(`📋 Últimas ${images.length} imagens:\n`);

  images.forEach((img, idx) => {
    console.log(`${idx + 1}. Task ID: ${img.task_id}`);
    console.log(`   User ID: ${img.user_id}`);
    console.log(`   Status: ${img.status}`);
    console.log(`   Engine: ${img.image_engine}`);
    console.log(`   Influencer ID: ${img.influencer_id || 'não definido'}`);
    console.log(`   Prompt: ${img.prompt?.substring(0, 100)}...`);
    console.log(`   Criado em: ${new Date(img.created_at).toLocaleString()}`);
    if (img.output_images && img.output_images.length > 0) {
      console.log(`   URL: ${img.output_images[0].substring(0, 80)}...`);
    }
    console.log('');
  });

  console.log('\n🔍 Verificando se há imagens completas sem influencer_id...\n');

  const imagesWithoutInfluencer = images.filter(img =>
    img.status === 'completed' &&
    img.output_images?.[0] &&
    !img.influencer_id
  );

  if (imagesWithoutInfluencer.length > 0) {
    console.log(`⚠️  Encontradas ${imagesWithoutInfluencer.length} imagens completas sem influencer_id:`);
    imagesWithoutInfluencer.forEach((img, idx) => {
      console.log(`\n   ${idx + 1}. Task ID: ${img.task_id}`);
      console.log(`      Criado em: ${new Date(img.created_at).toLocaleString()}`);
      console.log(`      Prompt: ${img.prompt?.substring(0, 80)}...`);
    });
  }
}

checkRecentImages().catch(console.error);
