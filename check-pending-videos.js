import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const kieApiKey = process.env.KIE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!kieApiKey) {
  console.error('Missing KIE_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

async function checkPendingVideos() {
  console.log('Fetching pending videos...\n');

  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .in('status', ['queued', 'processing'])
    .not('kie_task_id', 'is', null)
    .order('queued_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No pending videos with kie_task_id found');
    return;
  }

  console.log(`Found ${videos.length} pending videos\n`);

  for (const video of videos) {
    console.log(`\n━━━ Video: ${video.title} (${video.id}) ━━━`);
    console.log(`  Status: ${video.status}`);
    console.log(`  KIE Task ID: ${video.kie_task_id}`);
    console.log(`  Queued at: ${video.queued_at || 'N/A'}`);

    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${kieApiKey}`,
          },
        }
      );

      if (!response.ok) {
        console.log(`  ❌ API request failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      const kieData = result.data || result;
      const { state, resultJson, failCode, failMsg, completeTime } = kieData;

      console.log(`  KIE State: ${state}`);

      if (state === 'success' && resultJson) {
        try {
          const parsedResult = JSON.parse(resultJson);
          const resultUrls = parsedResult.resultUrls || [];

          if (resultUrls.length > 0) {
            console.log(`  ✅ Video ready!`);
            console.log(`  Video URL: ${resultUrls[0]}`);

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
              console.log(`  ⚠️  Error updating video: ${updateError.message}`);
            } else {
              console.log(`  ✓ Database updated to 'ready'`);
            }
          }
        } catch (e) {
          console.log(`  ⚠️  Failed to parse resultJson: ${e.message}`);
        }
      } else if (state === 'fail') {
        console.log(`  ❌ Generation failed`);
        console.log(`  Fail code: ${failCode || 'UNKNOWN'}`);
        console.log(`  Fail message: ${failMsg || 'Unknown error'}`);

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
          console.log(`  ⚠️  Error updating video: ${updateError.message}`);
        } else {
          console.log(`  ✓ Database updated to 'failed'`);
        }
      } else if (state === 'waiting' || state === 'queuing' || state === 'generating') {
        console.log(`  ⏳ Still processing...`);

        if (video.status === 'queued') {
          const { error: updateError } = await supabase
            .from('videos')
            .update({ status: 'processing' })
            .eq('id', video.id);

          if (!updateError) {
            console.log(`  ✓ Status updated from 'queued' to 'processing'`);
          }
        }
      } else {
        console.log(`  ⚠️  Unknown state: ${state}`);
      }
    } catch (error) {
      console.log(`  ❌ Error checking video: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Check complete!');
}

checkPendingVideos().catch(console.error);
