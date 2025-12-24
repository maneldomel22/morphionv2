import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://selmogfyeujesrayxrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllVideos() {
  try {
    // Login with mock user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Logged in successfully');
    console.log('Checking all pending videos...\n');

    const token = authData.session.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/check-all-pending-videos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Checked ${result.checked} videos`);
      console.log('\nResults:');
      result.results.forEach((r, i) => {
        console.log(`\n${i + 1}. Task ID: ${r.taskId}`);
        console.log(`   State: ${r.state}`);
        console.log(`   Status: ${r.status}`);
        if (r.error) {
          console.log(`   Error: ${r.error}`);
        }
      });
    } else {
      console.error('❌ Error:', result.error);
    }

    // Fetch updated videos
    const { data: videos } = await supabase
      .from('videos')
      .select('id, status, video_url, kie_task_id')
      .order('created_at', { ascending: false });

    console.log('\n\n📊 Updated video statuses:');
    videos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.id.substring(0, 8)}... - Status: ${v.status} - Has URL: ${!!v.video_url}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllVideos();
