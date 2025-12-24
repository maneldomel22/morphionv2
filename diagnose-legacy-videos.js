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

async function diagnoseLegacyVideos() {
  console.log('🔍 Diagnóstico de Vídeos Legados\n');
  console.log('='.repeat(60));

  try {
    const { data: allVideos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`\n📊 Total de vídeos: ${allVideos.length}\n`);

    const stats = {
      total: allVideos.length,
      withoutFolderId: 0,
      withoutSourceMode: 0,
      withoutVideoModel: 0,
      withoutImageUrl: 0,
      withoutBasePrompt: 0,
      withoutUpdatedAt: 0,
      byStatus: {},
      byGenerationMode: {},
      byKieModel: {},
    };

    allVideos.forEach(video => {
      if (!video.folder_id) stats.withoutFolderId++;
      if (!video.source_mode) stats.withoutSourceMode++;
      if (!video.video_model) stats.withoutVideoModel++;
      if (!video.image_url) stats.withoutImageUrl++;
      if (!video.base_prompt) stats.withoutBasePrompt++;
      if (!video.updated_at) stats.withoutUpdatedAt++;

      stats.byStatus[video.status] = (stats.byStatus[video.status] || 0) + 1;

      if (video.generation_mode) {
        stats.byGenerationMode[video.generation_mode] =
          (stats.byGenerationMode[video.generation_mode] || 0) + 1;
      }

      if (video.kie_model) {
        stats.byKieModel[video.kie_model] =
          (stats.byKieModel[video.kie_model] || 0) + 1;
      }
    });

    console.log('📈 Estatísticas de Campos Faltantes:');
    console.log('-'.repeat(60));
    console.log(`  Sem folder_id:     ${stats.withoutFolderId} (${(stats.withoutFolderId/stats.total*100).toFixed(1)}%)`);
    console.log(`  Sem source_mode:   ${stats.withoutSourceMode} (${(stats.withoutSourceMode/stats.total*100).toFixed(1)}%)`);
    console.log(`  Sem video_model:   ${stats.withoutVideoModel} (${(stats.withoutVideoModel/stats.total*100).toFixed(1)}%)`);
    console.log(`  Sem image_url:     ${stats.withoutImageUrl} (${(stats.withoutImageUrl/stats.total*100).toFixed(1)}%)`);
    console.log(`  Sem base_prompt:   ${stats.withoutBasePrompt} (${(stats.withoutBasePrompt/stats.total*100).toFixed(1)}%)`);
    console.log(`  Sem updated_at:    ${stats.withoutUpdatedAt} (${(stats.withoutUpdatedAt/stats.total*100).toFixed(1)}%)`);

    console.log('\n📊 Distribuição por Status:');
    console.log('-'.repeat(60));
    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  ${status.padEnd(15)}: ${count.toString().padStart(4)} (${(count/stats.total*100).toFixed(1)}%)`);
      });

    console.log('\n🎬 Distribuição por Generation Mode:');
    console.log('-'.repeat(60));
    Object.entries(stats.byGenerationMode)
      .sort((a, b) => b[1] - a[1])
      .forEach(([mode, count]) => {
        console.log(`  ${(mode || 'NULL').padEnd(20)}: ${count.toString().padStart(4)} (${(count/stats.total*100).toFixed(1)}%)`);
      });

    console.log('\n🤖 Distribuição por KIE Model:');
    console.log('-'.repeat(60));
    Object.entries(stats.byKieModel)
      .sort((a, b) => b[1] - a[1])
      .forEach(([model, count]) => {
        console.log(`  ${(model || 'NULL').padEnd(20)}: ${count.toString().padStart(4)} (${(count/stats.total*100).toFixed(1)}%)`);
      });

    console.log('\n🔍 Exemplos de Vídeos Sem source_mode (primeiros 5):');
    console.log('-'.repeat(60));
    const videosWithoutSourceMode = allVideos.filter(v => !v.source_mode).slice(0, 5);
    videosWithoutSourceMode.forEach(video => {
      console.log(`\n  ID: ${video.id}`);
      console.log(`  Título: ${video.title}`);
      console.log(`  Status: ${video.status}`);
      console.log(`  Generation Mode: ${video.generation_mode || 'NULL'}`);
      console.log(`  KIE Model: ${video.kie_model || 'NULL'}`);
      console.log(`  Video Model: ${video.video_model || 'NULL'}`);
      console.log(`  Created: ${video.created_at}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico concluído!\n');

    const needsMigration = stats.withoutSourceMode > 0 ||
                          stats.withoutVideoModel > 0 ||
                          stats.withoutUpdatedAt > 0;

    if (needsMigration) {
      console.log('⚠️  AÇÃO NECESSÁRIA:');
      console.log('   Existem vídeos que precisam de normalização.');
      console.log('   Execute a próxima migração SQL para corrigir.');
    } else {
      console.log('✨ Todos os vídeos estão normalizados!');
    }

  } catch (error) {
    console.error('❌ Erro ao diagnosticar vídeos:', error);
    process.exit(1);
  }
}

diagnoseLegacyVideos();
