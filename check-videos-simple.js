// Script simples para verificar status de todos os vídeos pendentes

const KIE_API_KEY = '0a30cb34de4ec530f2d30fd705fe982f';

async function checkAllPendingVideos() {
  console.log('🔍 Verificando status de todos os vídeos pendentes no KIE...\n');

  const pendingVideos = [
    { id: '9591d537-0e19-4df0-9f3a-7e273d0a61fd', kie_task_id: 'b7b4cf3ba69a8ed50d9105eef4d2d28b' },
    { id: '45b96792-057a-4928-8777-d7478e44ad4e', kie_task_id: '76a2f4a4b037b20e1d9d403fb041debe' },
    { id: '077e18a7-dd0a-4de0-a815-3788b68084fc', kie_task_id: 'e0e3d35cd8ce90659b5772cad93adf29' },
    { id: 'a835a82f-c1de-4fd3-8441-0c4a752110cd', kie_task_id: '744418c71b9ebd1df0e1d13f45ace55b' },
    { id: '1d77db22-8709-4786-9b99-62e0656e2b73', kie_task_id: '23ad12233e46661ea5d9f1c5c5527125' },
    { id: '85f74256-deb2-47a5-a8c2-080e2d11674c', kie_task_id: '8c5a082701255f0c0cfd38a8df436782' },
    { id: 'c007409b-7b62-4fae-8a82-954732084bd7', kie_task_id: '0abc576da04ce5210ba2067c25699cb8' },
  ];

  const results = [];

  for (const video of pendingVideos) {
    console.log(`\n📹 Video: ${video.id.substring(0, 8)}...`);
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
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
        results.push({ videoId: video.id, taskId: video.kie_task_id, error: `HTTP ${response.status}` });
        continue;
      }

      const result = await response.json();
      const kieData = result.data || result;
      const { state, resultJson, failCode, failMsg, createTime, completeTime } = kieData;

      console.log(`   KIE State: ${state}`);

      if (state === 'success' && resultJson) {
        try {
          const parsedResult = JSON.parse(resultJson);
          const resultUrls = parsedResult.resultUrls || [];

          if (resultUrls.length > 0) {
            console.log(`   ✅ READY - Video URL available`);
            console.log(`   🎬 URL: ${resultUrls[0]}`);
            results.push({
              videoId: video.id,
              taskId: video.kie_task_id,
              state: 'success',
              status: 'ready',
              videoUrl: resultUrls[0]
            });
          } else {
            console.log(`   ⚠️  Success but no URLs in resultJson`);
            results.push({ videoId: video.id, taskId: video.kie_task_id, state, status: 'unknown' });
          }
        } catch (parseError) {
          console.log(`   ❌ Failed to parse resultJson: ${parseError.message}`);
          results.push({ videoId: video.id, taskId: video.kie_task_id, error: 'Parse error' });
        }
      } else if (state === 'fail') {
        console.log(`   ❌ FAILED`);
        console.log(`   Code: ${failCode}`);
        console.log(`   Message: ${failMsg}`);
        results.push({
          videoId: video.id,
          taskId: video.kie_task_id,
          state: 'fail',
          status: 'failed',
          failCode,
          failMsg
        });
      } else if (state === 'waiting' || state === 'queuing' || state === 'generating') {
        console.log(`   ⏳ PROCESSING - Still generating...`);
        const elapsed = createTime ? Math.round((Date.now() - createTime) / 1000 / 60) : 0;
        console.log(`   ⏱️  Time elapsed: ~${elapsed} minutes`);
        results.push({
          videoId: video.id,
          taskId: video.kie_task_id,
          state,
          status: 'processing'
        });
      } else {
        console.log(`   ⚠️  Unknown state: ${state}`);
        results.push({ videoId: video.id, taskId: video.kie_task_id, state, status: 'unknown' });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ videoId: video.id, taskId: video.kie_task_id, error: error.message });
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));

  const readyCount = results.filter(r => r.status === 'ready').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const processingCount = results.filter(r => r.status === 'processing').length;
  const errorCount = results.filter(r => r.error).length;

  console.log(`Total checked: ${results.length}`);
  console.log(`✅ Ready: ${readyCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`⏳ Processing: ${processingCount}`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log('='.repeat(80) + '\n');

  if (readyCount > 0) {
    console.log('\n🎬 READY VIDEOS:');
    results.filter(r => r.status === 'ready').forEach((r, i) => {
      console.log(`\n${i + 1}. Video ID: ${r.videoId.substring(0, 8)}...`);
      console.log(`   Task ID: ${r.taskId}`);
      console.log(`   URL: ${r.videoUrl}`);
    });
  }

  if (failedCount > 0) {
    console.log('\n\n❌ FAILED VIDEOS:');
    results.filter(r => r.status === 'failed').forEach((r, i) => {
      console.log(`\n${i + 1}. Video ID: ${r.videoId.substring(0, 8)}...`);
      console.log(`   Task ID: ${r.taskId}`);
      console.log(`   Error Code: ${r.failCode}`);
      console.log(`   Error Message: ${r.failMsg}`);
    });
  }

  return results;
}

checkAllPendingVideos();
