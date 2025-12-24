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
const TASK_ID = process.argv[2] || '538e4380717c926d8fd8a2ecb9cfb790';

async function checkAndUpdate() {
  console.log(`🔍 Checking task ID: ${TASK_ID}\n`);

  try {
    const response = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      }
    );

    const result = await response.json();

    console.log('📋 KIE Response:');
    console.log('  Status Code:', result.code);

    if (result.code !== 200) {
      console.log('  ❌ Error:', result.msg);
      return;
    }

    const { state, resultJson, failCode, failMsg, completeTime } = result.data;

    console.log('  State:', state);

    let resultUrls = [];
    if (state === 'success' && resultJson) {
      const parsed = JSON.parse(resultJson);
      resultUrls = parsed.resultUrls || [];
      console.log('  ✅ Video URL:', resultUrls[0]);
    } else if (state === 'fail') {
      console.log('  ❌ Failed:', failMsg);
    }

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, title, status, video_url')
      .eq('kie_task_id', TASK_ID)
      .maybeSingle();

    if (videoError) {
      console.log('\n❌ Error finding video:', videoError.message);
      return;
    }

    if (!video) {
      console.log('\n⚠️  Video not found in database with this task_id');
      console.log('   You may need to manually insert the task_id into a video record');
      return;
    }

    console.log('\n📹 Current Database Status:');
    console.log('  Video ID:', video.id);
    console.log('  Title:', video.title);
    console.log('  Status:', video.status);
    console.log('  Video URL:', video.video_url || 'null');

    if (state === 'success' && resultUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'ready',
          video_url: resultUrls[0],
          thumbnail_url: resultUrls[0],
          completed_at: completeTime ? new Date(completeTime).toISOString() : new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) {
        console.log('\n❌ Error updating video:', updateError.message);
      } else {
        console.log('\n✅ Video updated successfully!');
        console.log('  New status: ready');
        console.log('  Video URL:', resultUrls[0]);
      }
    } else if (state === 'fail') {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'failed',
          kie_fail_code: failCode || 'UNKNOWN',
          kie_fail_message: failMsg || 'Unknown error',
          completed_at: completeTime ? new Date(completeTime).toISOString() : new Date().toISOString(),
        })
        .eq('id', video.id);

      if (!updateError) {
        console.log('\n✅ Video marked as failed');
      }
    } else {
      console.log(`\n⏳ Video is still ${state}, no update needed`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkAndUpdate();
