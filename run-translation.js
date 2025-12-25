import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://selmogfyeujesrayxrhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU'
);

console.log('🚀 Calling translate-all-influencers edge function...\n');

const { data, error } = await supabase.functions.invoke('translate-all-influencers', {
  body: {}
});

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('\n✅ Response:', JSON.stringify(data, null, 2));
