import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const influencerId = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf';

  console.log('Triggering bodymap creation for Manu...');

  // Get influencer details
  const { data: influencer, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', influencerId)
    .single();

  if (error || !influencer) {
    console.error('Failed to get influencer:', error);
    return;
  }

  console.log('Influencer status:', {
    name: influencer.name,
    creation_status: influencer.creation_status,
    profile_image_url: influencer.profile_image_url,
    bodymap_task_id: influencer.bodymap_task_id
  });

  if (!influencer.profile_image_url) {
    console.error('Profile image URL not available yet');
    return;
  }

  if (influencer.bodymap_task_id) {
    console.log('Bodymap task already exists:', influencer.bodymap_task_id);
    return;
  }

  // Call admin sync function
  const response = await fetch(
    `${supabaseUrl}/functions/v1/admin-sync-influencer-images`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  console.log('Sync result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
