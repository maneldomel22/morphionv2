const SUPABASE_URL = 'https://selmogfyeujesrayxrhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';

async function updateAllVideos() {
  try {
    console.log('Calling check-all-pending-videos edge function...\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-all-pending-videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('Results:');
    console.log(`Total videos checked: ${result.checked}`);
    console.log('\nDetails:');

    if (result.results && result.results.length > 0) {
      result.results.forEach((r, index) => {
        console.log(`\n[${index + 1}] Task ID: ${r.taskId}`);
        console.log(`    State: ${r.state || 'unknown'}`);
        console.log(`    Status: ${r.status || 'unknown'}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
    } else {
      console.log('No pending videos found.');
    }

  } catch (error) {
    console.error('Error updating videos:', error.message);
    process.exit(1);
  }
}

updateAllVideos();
