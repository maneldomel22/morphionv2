import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function checkAllImages() {
  console.log('🔍 Verificando todas as imagens no sistema...\n');

  const { data, error } = await supabase
    .from('generated_images')
    .select('id, task_id, status, image_url, prompt, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total de imagens (últimas 20): ${data.length}\n`);

  const statusCount = {};
  data.forEach(img => {
    statusCount[img.status] = (statusCount[img.status] || 0) + 1;
  });

  console.log('📈 Resumo por status:');
  Object.entries(statusCount).forEach(([status, count]) => {
    let emoji = '⏳';
    if (status === 'completed') emoji = '✅';
    if (status === 'failed') emoji = '❌';
    if (status === 'generating') emoji = '🔄';
    console.log(`   ${emoji} ${status}: ${count}`);
  });
  console.log('');

  console.log('📋 Últimas imagens:');
  data.slice(0, 10).forEach((img, idx) => {
    const createdDate = new Date(img.created_at);
    const minutesAgo = Math.floor((Date.now() - createdDate) / 1000 / 60);

    let statusEmoji = '⏳';
    if (img.status === 'completed') statusEmoji = '✅';
    if (img.status === 'failed') statusEmoji = '❌';
    if (img.status === 'generating') statusEmoji = '🔄';

    console.log(`${idx + 1}. ${statusEmoji} ${img.status.toUpperCase()}`);
    console.log(`   Task: ${img.task_id}`);
    console.log(`   Prompt: ${(img.prompt || '').substring(0, 80)}...`);
    console.log(`   Criado: ${minutesAgo} min atrás`);
    if (img.image_url) {
      console.log(`   ✓ URL disponível`);
    }
    console.log('');
  });
}

checkAllImages().catch(console.error);
