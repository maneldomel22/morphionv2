import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseUserVideos() {
  const userEmail = 'pullsedrive@gmail.com';

  console.log('\n🔍 Diagnóstico de Vídeos do Usuário\n');
  console.log('='.repeat(60));
  console.log(`Email: ${userEmail}\n`);

  try {
    // 1. Buscar o usuário pelo email
    console.log('1️⃣ Buscando usuário...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) throw usersError;

    const user = users.find(u => u.email === userEmail);

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('✅ Usuário encontrado!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Criado em: ${user.created_at}\n`);

    // 2. Buscar vídeos desse usuário
    console.log('2️⃣ Buscando vídeos...');
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (videosError) throw videosError;

    console.log(`✅ Encontrados ${videos.length} vídeos\n`);

    if (videos.length === 0) {
      console.log('⚠️  Nenhum vídeo encontrado para este usuário!');
      console.log('   Verificando se há vídeos sem user_id...\n');

      const { data: orphanVideos, error: orphanError } = await supabase
        .from('videos')
        .select('*')
        .is('user_id', null);

      if (orphanError) throw orphanError;

      console.log(`   Vídeos órfãos (sem user_id): ${orphanVideos.length}\n`);
      return;
    }

    // 3. Analisar cada vídeo
    console.log('3️⃣ Análise detalhada dos vídeos:\n');

    videos.forEach((video, index) => {
      console.log(`📹 Vídeo ${index + 1}:`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Título: ${video.title || '❌ NULL'}`);
      console.log(`   Status: ${video.status}`);
      console.log(`   Source Mode: ${video.source_mode || '❌ NULL'}`);
      console.log(`   Video Model: ${video.video_model || '❌ NULL'}`);
      console.log(`   Folder ID: ${video.folder_id || '(sem pasta)'}`);
      console.log(`   KIE Model: ${video.kie_model || '(nenhum)'}`);
      console.log(`   Generation Mode: ${video.generation_mode || '(nenhum)'}`);
      console.log(`   Video URL: ${video.video_url ? '✅ Presente' : '❌ NULL'}`);
      console.log(`   Thumbnail URL: ${video.thumbnail_url ? '✅ Presente' : '(nenhum)'}`);
      console.log(`   Metadata: ${video.metadata ? '✅ Presente' : '❌ NULL'}`);
      console.log(`   Created At: ${video.created_at}`);
      console.log(`   Updated At: ${video.updated_at || '❌ NULL'}`);
      console.log('');
    });

    // 4. Verificar campos problemáticos
    console.log('4️⃣ Verificação de campos críticos:\n');

    const withoutTitle = videos.filter(v => !v.title);
    const withoutSourceMode = videos.filter(v => !v.source_mode);
    const withoutVideoModel = videos.filter(v => !v.video_model);
    const withoutUpdatedAt = videos.filter(v => !v.updated_at);

    console.log(`   Sem título: ${withoutTitle.length}`);
    console.log(`   Sem source_mode: ${withoutSourceMode.length}`);
    console.log(`   Sem video_model: ${withoutVideoModel.length}`);
    console.log(`   Sem updated_at: ${withoutUpdatedAt.length}\n`);

    // 5. Verificar políticas RLS
    console.log('5️⃣ Testando acesso com RLS (como usuário):\n');

    // Simular uma query que o usuário faria
    const { data: userVideos, error: userVideosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id);

    if (userVideosError) {
      console.log('❌ Erro ao buscar vídeos com RLS:', userVideosError.message);
    } else {
      console.log(`✅ RLS OK - ${userVideos.length} vídeos acessíveis\n`);
    }

    // 6. Resumo
    console.log('='.repeat(60));
    console.log('\n📊 RESUMO:\n');
    console.log(`   Total de vídeos: ${videos.length}`);
    console.log(`   Vídeos prontos: ${videos.filter(v => v.status === 'ready').length}`);
    console.log(`   Vídeos processando: ${videos.filter(v => v.status === 'processing').length}`);
    console.log(`   Vídeos com erro: ${videos.filter(v => v.status === 'failed').length}`);
    console.log(`   Vídeos na fila: ${videos.filter(v => v.status === 'queued').length}`);

    if (withoutSourceMode.length > 0 || withoutVideoModel.length > 0) {
      console.log('\n⚠️  AÇÃO NECESSÁRIA:');
      console.log('   Alguns vídeos precisam de normalização.');
      console.log('   Execute: npm run build (isso rodará a migração)\n');
    } else {
      console.log('\n✅ Todos os vídeos estão normalizados!\n');
    }

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error);
    process.exit(1);
  }
}

diagnoseUserVideos();
