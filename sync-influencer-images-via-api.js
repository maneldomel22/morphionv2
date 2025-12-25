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
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

async function syncInfluencerImages() {
  console.log('🔄 Sincronizando imagens das influencers via API...\n');

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/admin-sync-influencer-images`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    console.log(`✅ Total de influencers verificadas: ${result.total}\n`);

    if (result.results && result.results.length > 0) {
      for (const inf of result.results) {
        console.log(`\n📋 ${inf.name} (${inf.id})`);
        console.log(`   Status: ${inf.status}`);

        if (inf.profileTaskState) {
          console.log(`   Foto de perfil: ${inf.profileTaskState}`);
          if (inf.profileImageUrl) {
            console.log(`   ✅ URL atualizada: ${inf.profileImageUrl.substring(0, 60)}...`);
          }
        }

        if (inf.bodymapTaskState) {
          console.log(`   Bodymap: ${inf.bodymapTaskState}`);
          if (inf.bodymapUrl) {
            console.log(`   ✅ URL atualizada: ${inf.bodymapUrl.substring(0, 60)}...`);
          }
        }

        if (inf.updated) {
          console.log(`   ✅ Influencer atualizada com sucesso!`);
        }

        if (inf.profileError || inf.bodymapError) {
          console.log(`   ⚠️  Erros: ${inf.profileError || ''} ${inf.bodymapError || ''}`);
        }
      }
    } else {
      console.log('ℹ️  Nenhuma influencer em processo de criação encontrada.');
    }

    console.log('\n\n✅ Sincronização concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

syncInfluencerImages();
