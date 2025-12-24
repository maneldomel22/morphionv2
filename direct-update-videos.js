import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://selmogfyeujesrayxrhs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KIE_API_KEY = process.env.KIE_API_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

if (!KIE_API_KEY) {
  console.error('KIE_API_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateAllVideos() {
  try {
    console.log('Fetching pending videos from database...\n');

    const { data: pendingVideos, error } = await supabase
      .from('videos')
      .select('*')
      .in('status', ['queued', 'processing'])
      .not('kie_task_id', 'is', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!pendingVideos || pendingVideos.length === 0) {
      console.log('No pending videos with kie_task_id found.');
      return;
    }

    console.log(`Found ${pendingVideos.length} videos to check:\n`);

    for (const video of pendingVideos) {
      console.log(`\n[Video ID: ${video.id.substring(0, 8)}...]`);
      console.log(`  Title: ${video.title}`);
      console.log(`  Current Status: ${video.status}`);
      console.log(`  KIE Task ID: ${video.kie_task_id}`);

      try {
        const kieResponse = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
          }
        );

        if (!kieResponse.ok) {
          console.log(`  ❌ KIE API request failed: HTTP ${kieResponse.status}`);
          continue;
        }

        const kieResult = await kieResponse.json();

        if (kieResult.code !== 200) {
          console.log(`  ❌ KIE API error: ${kieResult.code} - ${kieResult.msg || kieResult.message}`);
          continue;
        }

        const kieData = kieResult.data;
        const { state, resultJson, failCode, failMsg, completeTime } = kieData;

        console.log(`  KIE State: ${state}`);

        let resultUrls = [];
        if (state === 'success' && resultJson) {
          try {
            const parsedResult = JSON.parse(resultJson);
            resultUrls = parsedResult.resultUrls || [];
          } catch (e) {
            console.error('  Failed to parse resultJson');
          }
        }

        if (state === 'success' && resultUrls.length > 0) {
          const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

          const { error: updateError } = await supabase
            .from('videos')
            .update({
              status: 'ready',
              video_url: resultUrls[0],
              thumbnail_url: resultUrls[0],
              completed_at: completedAt,
            })
            .eq('id', video.id);

          if (updateError) {
            console.log(`  ❌ Failed to update database: ${updateError.message}`);
          } else {
            console.log(`  ✅ Updated to READY`);
            console.log(`  Video URL: ${resultUrls[0].substring(0, 50)}...`);
          }
        } else if (state === 'fail') {
          const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

          const { error: updateError } = await supabase
            .from('videos')
            .update({
              status: 'failed',
              kie_fail_code: failCode || 'UNKNOWN',
              kie_fail_message: failMsg || 'Unknown error',
              completed_at: completedAt,
            })
            .eq('id', video.id);

          if (updateError) {
            console.log(`  ❌ Failed to update database: ${updateError.message}`);
          } else {
            console.log(`  ❌ Updated to FAILED`);
            console.log(`  Error: ${failMsg || 'Unknown error'}`);
          }
        } else if (state === 'waiting' || state === 'queuing' || state === 'generating') {
          if (video.status === 'queued') {
            const { error: updateError } = await supabase
              .from('videos')
              .update({ status: 'processing' })
              .eq('id', video.id);

            if (updateError) {
              console.log(`  ❌ Failed to update database: ${updateError.message}`);
            } else {
              console.log(`  🔄 Updated to PROCESSING`);
            }
          } else {
            console.log(`  🔄 Still ${state.toUpperCase()}`);
          }
        } else {
          console.log(`  ⚠️ Unknown state: ${state}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('\n✅ All videos checked!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

updateAllVideos();
