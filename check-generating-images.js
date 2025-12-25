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

async function checkGeneratingImages() {
  console.log('🔍 Buscando imagens com status "generating"...\n');

  const { data, error } = await supabase
    .from('generated_images')
    .select('id, task_id, status, image_url, prompt, original_prompt, created_at, user_id')
    .eq('status', 'generating')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total de imagens gerando: ${data.length}\n`);

  if (data.length === 0) {
    console.log('✅ Nenhuma imagem pendente no momento!\n');
    return;
  }

  data.forEach((img, idx) => {
    const createdDate = new Date(img.created_at);
    const now = new Date();
    const minutesAgo = Math.floor((now - createdDate) / 1000 / 60);

    console.log(`[${idx + 1}] 🖼️  Imagem ID: ${img.id}`);
    console.log(`    📋 Task ID: ${img.task_id}`);
    console.log(`    💬 Prompt: ${(img.original_prompt || img.prompt || '').substring(0, 100)}...`);
    console.log(`    ⏰ Criado: ${createdDate.toLocaleString('pt-BR')} (${minutesAgo} min atrás)`);
    console.log(`    👤 User ID: ${img.user_id}`);
    console.log('');
  });


  console.log('\n🔄 Chamando edge function para atualizar automaticamente...\n');

  try {
    const updateResponse = await fetch(
      `${envVars.VITE_SUPABASE_URL}/functions/v1/update-pending-images`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envVars.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      }
    );

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Edge function executada com sucesso!');
      console.log(`   Total verificado: ${updateData.totalChecked}`);
      console.log(`   Resultados:`, updateData.results);
    } else {
      console.log('❌ Erro ao executar edge function:', updateResponse.status);
    }
  } catch (error) {
    console.log('❌ Erro ao chamar edge function:', error.message);
  }
}

checkGeneratingImages().catch(console.error);
