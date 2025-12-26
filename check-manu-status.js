import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://selmogfyeujesrayxrhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';
const supabase = createClient(supabaseUrl, supabaseKey);

const influencerId = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf';

console.log('Checking Manu status...\n');

// Check influencer
const { data: influencer } = await supabase
  .from('influencers')
  .select('*')
  .eq('id', influencerId)
  .single();

console.log('Influencer status:', influencer.creation_status);
console.log('Profile image URL:', influencer.profile_image_url || 'Not yet');
console.log('Bodymap URL:', influencer.bodymap_url || 'Not yet');

// Check generated_images
const { data: images } = await supabase
  .from('generated_images')
  .select('*')
  .eq('influencer_id', influencerId)
  .order('created_at', { ascending: false });

console.log('\nGenerated images:', images?.length || 0);
images?.forEach(img => {
  console.log(`- ${img.image_type}: ${img.status} (task: ${img.task_id})`);
});
