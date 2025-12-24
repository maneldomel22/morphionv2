import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim();
  }
});

const KIE_API_KEY = env.KIE_API_KEY;
const TASK_ID = process.argv[2] || '538e4380717c926d8fd8a2ecb9cfb790';

async function checkTask() {
  console.log(`🔍 Checking task: ${TASK_ID}\n`);

  if (!KIE_API_KEY) {
    console.error('❌ KIE_API_KEY not found in .env');
    return;
  }

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

    console.log('📋 Full Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.code === 200 && result.data) {
      const { state, resultJson, failCode, failMsg, completeTime, createTime } = result.data;

      console.log('\n✨ Summary:');
      console.log('  State:', state);
      console.log('  Created:', createTime);
      console.log('  Completed:', completeTime);

      if (state === 'success' && resultJson) {
        const parsed = JSON.parse(resultJson);
        console.log('\n✅ VIDEO IS READY!');
        console.log('  URL:', parsed.resultUrls?.[0]);
      } else if (state === 'fail') {
        console.log('\n❌ VIDEO FAILED');
        console.log('  Code:', failCode);
        console.log('  Message:', failMsg);
      } else {
        console.log(`\n⏳ Still ${state}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTask();
