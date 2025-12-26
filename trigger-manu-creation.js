const supabaseUrl = 'https://selmogfyeujesrayxrhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';

const influencerId = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf';

console.log('Calling admin-process-influencer...');

const response = await fetch(`${supabaseUrl}/functions/v1/admin-process-influencer`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    influencer_id: influencerId
  })
});

const text = await response.text();
console.log('Response status:', response.status);
console.log('Response:', text);
