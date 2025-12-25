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
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInfluencerDetails() {
  console.log('🔍 Verificando detalhes das influencers em criação...\n');

  try {
    const { data: influencers, error: fetchError } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!influencers || influencers.length === 0) {
      console.log('✅ Nenhuma influencer em processo de criação!');
      return;
    }

    for (const inf of influencers) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 ${inf.name} (${inf.username})`);
      console.log(`   ID: ${inf.id}`);
      console.log(`   Status: ${inf.creation_status}`);
      console.log(`   Mode: ${inf.mode || 'N/A'}`);
      console.log(`   Age: ${inf.age || 'N/A'}`);
      console.log(`\n📸 Imagens:`);
      console.log(`   image_url: ${inf.image_url || 'null'}`);
      console.log(`   profile_image_url: ${inf.profile_image_url || 'null'}`);
      console.log(`   bodymap_url: ${inf.bodymap_url || 'null'}`);
      console.log(`   reference_frame_url: ${inf.reference_frame_url || 'null'}`);
      console.log(`\n🎬 Vídeo:`);
      console.log(`   intro_video_url: ${inf.intro_video_url || 'null'}`);
      console.log(`\n📋 Task IDs:`);
      console.log(`   intro_video_task_id: ${inf.intro_video_task_id || 'null'}`);
      console.log(`   profile_image_task_id: ${inf.profile_image_task_id || 'null'}`);
      console.log(`   bodymap_task_id: ${inf.bodymap_task_id || 'null'}`);
      console.log(`\n🧬 Identity Profile:`);
      if (inf.identity_profile) {
        console.log(`   ethnicity: ${inf.identity_profile.ethnicity || 'N/A'}`);
        console.log(`   facial_traits: ${inf.identity_profile.facial_traits || 'N/A'}`);
        console.log(`   hair: ${inf.identity_profile.hair || 'N/A'}`);
        console.log(`   body: ${inf.identity_profile.body || 'N/A'}`);
        console.log(`   marks: ${inf.identity_profile.marks || 'N/A'}`);
      } else {
        console.log(`   N/A`);
      }
      console.log(`\n📊 Creation Metadata:`);
      if (inf.creation_metadata) {
        console.log(`   language: ${inf.creation_metadata.language || 'N/A'}`);
        console.log(`   started_at: ${inf.creation_metadata.started_at || 'N/A'}`);
      } else {
        console.log(`   N/A`);
      }
      console.log(`\n⏰ Timestamps:`);
      console.log(`   created_at: ${inf.created_at}`);
      console.log(`   updated_at: ${inf.updated_at}`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkInfluencerDetails();
