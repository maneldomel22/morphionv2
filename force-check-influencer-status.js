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
const kieApiKey = envVars.KIE_API_KEY;

if (!supabaseUrl || !supabaseKey || !kieApiKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('   KIE_API_KEY:', kieApiKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKieTaskStatus(taskId) {
  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
    {
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to check task ${taskId}`);
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`KIE API error for task ${taskId}: ${data.msg || 'Unknown error'}`);
  }

  let resultUrls = [];
  if (data.data?.state === 'success' && data.data?.resultJson) {
    try {
      const parsedResult = typeof data.data.resultJson === 'string'
        ? JSON.parse(data.data.resultJson)
        : data.data.resultJson;
      resultUrls = parsedResult.resultUrls || [];
    } catch (error) {
      console.error(`Failed to parse resultJson for task ${taskId}:`, error);
    }
  }

  return {
    state: data.data?.state,
    resultUrls,
    failCode: data.data?.failCode,
    failMsg: data.data?.failMsg,
  };
}

async function forceCheckInfluencerStatus() {
  console.log('🔄 Forçando verificação de status das influencers em criação...\n');

  try {
    // Buscar influencers que não estão prontas
    const { data: influencers, error: fetchError } = await supabase
      .from('influencers')
      .select('*')
      .neq('creation_status', 'ready')
      .neq('creation_status', 'failed');

    if (fetchError) {
      throw fetchError;
    }

    if (!influencers || influencers.length === 0) {
      console.log('✅ Nenhuma influencer em processo de criação encontrada!');
      return;
    }

    console.log(`📋 Encontradas ${influencers.length} influencer(s) em criação:\n`);

    for (const influencer of influencers) {
      console.log(`\n🔍 Verificando: ${influencer.name}`);
      console.log(`   ID: ${influencer.id}`);
      console.log(`   Status atual: ${influencer.creation_status}`);

      let updated = false;

      // Verificar profile image task
      if (influencer.profile_image_task_id && !influencer.profile_image_url) {
        console.log(`   📸 Verificando foto de perfil (${influencer.profile_image_task_id})...`);
        try {
          const profileStatus = await checkKieTaskStatus(influencer.profile_image_task_id);
          console.log(`      Estado: ${profileStatus.state}`);

          if (profileStatus.state === 'success' && profileStatus.resultUrls.length > 0) {
            console.log(`      ✅ URL encontrada: ${profileStatus.resultUrls[0]}`);

            const { error: updateError } = await supabase
              .from('influencers')
              .update({
                profile_image_url: profileStatus.resultUrls[0],
                image_url: profileStatus.resultUrls[0]
              })
              .eq('id', influencer.id);

            if (updateError) {
              console.error(`      ❌ Erro ao atualizar: ${updateError.message}`);
            } else {
              console.log(`      ✅ Foto atualizada com sucesso!`);
              updated = true;
            }
          }
        } catch (error) {
          console.error(`      ❌ Erro ao verificar: ${error.message}`);
        }
      }

      // Verificar bodymap task
      if (influencer.bodymap_task_id && !influencer.bodymap_url) {
        console.log(`   🗺️  Verificando bodymap (${influencer.bodymap_task_id})...`);
        try {
          const bodymapStatus = await checkKieTaskStatus(influencer.bodymap_task_id);
          console.log(`      Estado: ${bodymapStatus.state}`);

          if (bodymapStatus.state === 'success' && bodymapStatus.resultUrls.length > 0) {
            console.log(`      ✅ URL encontrada: ${bodymapStatus.resultUrls[0]}`);

            const { error: updateError } = await supabase
              .from('influencers')
              .update({ bodymap_url: bodymapStatus.resultUrls[0] })
              .eq('id', influencer.id);

            if (updateError) {
              console.error(`      ❌ Erro ao atualizar: ${updateError.message}`);
            } else {
              console.log(`      ✅ Bodymap atualizado com sucesso!`);
              updated = true;
            }
          }
        } catch (error) {
          console.error(`      ❌ Erro ao verificar: ${error.message}`);
        }
      }

      if (updated) {
        console.log(`   ✅ Influencer atualizada!`);
      } else {
        console.log(`   ℹ️  Nenhuma atualização necessária`);
      }
    }

    console.log('\n\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

forceCheckInfluencerStatus();
