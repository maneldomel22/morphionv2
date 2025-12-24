// Script para verificar o status de todos os vídeos pendentes diretamente no KIE

const KIE_API_KEY = process.env.KIE_API_KEY;
const SUPABASE_URL = 'https://selmogfyeujesrayxrhs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAllPendingVideos() {
  if (!KIE_API_KEY) {
    console.error('❌ KIE_API_KEY not set in environment');
    return;
  }

  console.log('🔍 Fetching all pending videos from database...\n');

  const { data: pendingVideos, error } = await supabase
    .from('videos')
    .select('*')
    .in('status', ['queued', 'processing'])
    .not('kie_task_id', 'is', null);

  if (error) {
    console.error('❌ Error fetching videos:', error);
    return;
  }

  if (!pendingVideos || pendingVideos.length === 0) {
    console.log('✅ No pending videos found');
    return;
  }

  console.log(`📋 Found ${pendingVideos.length} pending videos\n`);

  let updatedCount = 0;
  let readyCount = 0;
  let failedCount = 0;

  for (const video of pendingVideos) {
    console.log(`\n📹 Checking video: ${video.id.substring(0, 8)}...`);
    console.log(`   Current status: ${video.status}`);
    console.log(`   Task ID: ${video.kie_task_id}`);

    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
        }
      );

      if (!response.ok) {
        console.log(`   ⚠️  API request failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      const kieData = result.data || result;
      const { state, resultJson, failCode, failMsg, completeTime } = kieData;

      console.log(`   KIE State: ${state}`);

      if (state === 'success' && resultJson) {
        const parsedResult = JSON.parse(resultJson);
        const resultUrls = parsedResult.resultUrls || [];

        if (resultUrls.length > 0) {
          const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

          await supabase
            .from('videos')
            .update({
              status: 'ready',
              video_url: resultUrls[0],
              thumbnail_url: resultUrls[0],
              completed_at: completedAt,
            })
            .eq('id', video.id);

          console.log(`   ✅ Updated to READY`);
          console.log(`   🎬 Video URL: ${resultUrls[0].substring(0, 60)}...`);
          updatedCount++;
          readyCount++;
        }
      } else if (state === 'fail') {
        const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

        await supabase
          .from('videos')
          .update({
            status: 'failed',
            kie_fail_code: failCode || 'UNKNOWN',
            kie_fail_message: failMsg || 'Unknown error',
            completed_at: completedAt,
          })
          .eq('id', video.id);

        console.log(`   ❌ Updated to FAILED`);
        console.log(`   Error: ${failMsg}`);
        updatedCount++;
        failedCount++;
      } else if (state === 'waiting' || state === 'queuing' || state === 'generating') {
        if (video.status === 'queued') {
          await supabase
            .from('videos')
            .update({ status: 'processing' })
            .eq('id', video.id);
          console.log(`   ⏳ Updated to PROCESSING`);
          updatedCount++;
        } else {
          console.log(`   ⏳ Still processing...`);
        }
      } else {
        console.log(`   ⚠️  Unknown state: ${state}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total checked: ${pendingVideos.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Ready: ${readyCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('='.repeat(60) + '\n');

  // Fetch and display final stats
  const { data: allVideos } = await supabase
    .from('videos')
    .select('status')
    .order('created_at', { ascending: false });

  if (allVideos) {
    const stats = allVideos.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Current database stats:');
    Object.entries(stats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  }
}

checkAllPendingVideos();
