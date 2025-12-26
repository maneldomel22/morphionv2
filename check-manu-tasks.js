const KIE_API_KEY = process.env.KIE_API_KEY;

const tasks = [
  '51736c6e093a718c93b45160a9517094',
  'e3cedc937e9f886ea72d605feb1a3928'
];

async function checkTask(taskId) {
  console.log(`\n=== Checking task ${taskId} ===`);

  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`
      }
    }
  );

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.code === 200 && data.data?.state === 'success' && data.data?.resultJson) {
    const result = typeof data.data.resultJson === 'string'
      ? JSON.parse(data.data.resultJson)
      : data.data.resultJson;
    console.log('Result URLs:', result.resultUrls);
  }
}

async function main() {
  for (const taskId of tasks) {
    await checkTask(taskId);
  }
}

main().catch(console.error);
