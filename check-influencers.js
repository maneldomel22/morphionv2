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

async function checkInfluencers() {
  console.log('🔍 Listando todos os influencers...\n');

  const { data: influencers, error } = await supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar influencers:', error);
    return;
  }

  if (!influencers || influencers.length === 0) {
    console.log('✅ Nenhum influencer encontrado.');
    return;
  }

  console.log(`📋 Total de ${influencers.length} influencers:\n`);

  for (const influencer of influencers) {
    console.log(`\n👤 ${influencer.name} (@${influencer.username})`);
    console.log(`   ID: ${influencer.id}`);
    console.log(`   User ID: ${influencer.user_id}`);
    console.log(`   Image URL: ${influencer.image_url?.substring(0, 80)}${influencer.image_url?.length > 80 ? '...' : ''}`);
    console.log(`   Criado em: ${new Date(influencer.created_at).toLocaleString()}`);
    console.log(`   Atualizado em: ${new Date(influencer.updated_at).toLocaleString()}`);
  }

  console.log('\n✨ Listagem concluída!');
}

checkInfluencers().catch(console.error);
