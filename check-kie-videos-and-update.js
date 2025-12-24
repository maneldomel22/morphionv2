import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const KIE_API_KEY = env.KIE_API_KEY;

async function checkVideoInKie(taskId) {
  try {
    const response = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (result.code !== 200) {
      return { error: result.msg || 'Unknown error', code: result.code };
    }

    const { state, resultJson, failCode, failMsg, completeTime } = result.data;

    let resultUrls = [];
    if (state === 'success' && resultJson) {
      try {
        const parsed = JSON.parse(resultJson);
        resultUrls = parsed.resultUrls || [];
      } catch (e) {
        console.error('Failed to parse resultJson:', e);
      }
    }

    return {
      state,
      resultUrls,
      failCode,
      failMsg,
      completeTime,
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔍 Checking videos in queued or failed status...\n');

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title, status, kie_task_id, video_url, created_at')
    .in('status', ['queued', 'processing', 'failed', 'error'])
    .not('kie_task_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No videos found with kie_task_id in queued/failed status');
    return;
  }

  console.log(`Found ${videos.length} videos to check\n`);

  let updatedCount = 0;
  let failedCount = 0;
  let unchangedCount = 0;

  for (const video of videos) {
    console.log(`\n📹 Checking: ${video.title} (${video.id})`);
    console.log(`   Task ID: ${video.kie_task_id}`);
    console.log(`   Current status: ${video.status}`);

    const kieStatus = await checkVideoInKie(video.kie_task_id);

    if (kieStatus.error) {
      console.log(`   ❌ Error checking KIE: ${kieStatus.error}`);
      continue;
    }

    console.log(`   KIE state: ${kieStatus.state}`);

    if (kieStatus.state === 'success' && kieStatus.resultUrls.length > 0) {
      console.log(`   ✅ Video is ready! URL: ${kieStatus.resultUrls[0]}`);

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'ready',
          video_url: kieStatus.resultUrls[0],
          thumbnail_url: kieStatus.resultUrls[0],
          completed_at: kieStatus.completeTime
            ? new Date(kieStatus.completeTime).toISOString()
            : new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failedCount++;
      } else {
        console.log(`   ✅ Updated to 'ready' status`);
        updatedCount++;

        await supabase
          .from('video_generation_logs')
          .insert({
            video_id: video.id,
            kie_task_id: video.kie_task_id,
            event_type: 'status_updated',
            event_data: {
              new_status: 'ready',
              video_url: kieStatus.resultUrls[0],
              complete_time: kieStatus.completeTime,
              updated_via: 'manual_check_script',
            },
          });
      }
    } else if (kieStatus.state === 'fail') {
      console.log(`   ❌ Video failed in KIE: ${kieStatus.failMsg}`);

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'failed',
          kie_fail_code: kieStatus.failCode || 'UNKNOWN',
          kie_fail_message: kieStatus.failMsg || 'Unknown error',
          completed_at: kieStatus.completeTime
            ? new Date(kieStatus.completeTime).toISOString()
            : new Date().toISOString(),
        })
        .eq('id', video.id);

      if (!updateError) {
        console.log(`   ✅ Updated to 'failed' status`);
        updatedCount++;
      }
    } else {
      console.log(`   ⏳ Still ${kieStatus.state}`);
      unchangedCount++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ❌ Failed to update: ${failedCount}`);
  console.log(`   ⏳ Unchanged: ${unchangedCount}`);
  console.log(`   📹 Total checked: ${videos.length}`);
}

main().catch(console.error);
