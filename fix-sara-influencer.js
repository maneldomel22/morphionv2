import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSaraInfluencer() {
  try {
    console.log('🔍 Buscando influencer Sara...\n');

    const { data: influencer, error: fetchError } = await supabase
      .from('influencers')
      .select('*')
      .ilike('name', '%sara%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !influencer) {
      console.error('❌ Sara não encontrada:', fetchError);
      return;
    }

    console.log('✅ Sara encontrada:');
    console.log('ID:', influencer.id);
    console.log('Name:', influencer.name);
    console.log('Status:', influencer.creation_status);
    console.log('Video URL:', influencer.intro_video_url);
    console.log('Profile Task ID:', influencer.profile_image_task_id);
    console.log('Bodymap Task ID:', influencer.bodymap_task_id);
    console.log('\n---\n');

    if (influencer.creation_status !== 'creating_profile_image') {
      console.log('⚠️  Status não é creating_profile_image. Atual:', influencer.creation_status);
      return;
    }

    if (influencer.profile_image_task_id) {
      console.log('✅ Profile task ID já existe:', influencer.profile_image_task_id);
      console.log('O polling deve estar funcionando normalmente.');
      return;
    }

    console.log('🔧 Sara está travada sem profile_image_task_id');
    console.log('Vou resetar o status para creating_video para reprocessar...\n');

    // Reseta o status para que o polling reprocesse
    const { error: updateError } = await supabase
      .from('influencers')
      .update({
        creation_status: 'creating_video'
      })
      .eq('id', influencer.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError);
      return;
    }

    console.log('✅ Status resetado para creating_video');
    console.log('⏳ Aguardando 2 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Busca novamente para confirmar
    const { data: updatedInfluencer, error: recheckError } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencer.id)
      .single();

    if (recheckError) {
      console.error('❌ Erro ao buscar influencer atualizada:', recheckError);
      return;
    }

    console.log('📊 Status atualizado:', updatedInfluencer.creation_status);
    console.log('\n✅ Pronto! Agora o polling frontend deve chamar process-influencer-intro-video novamente.');
    console.log('💡 Vá até a página de Influencers e aguarde o polling completar o processo.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixSaraInfluencer();
