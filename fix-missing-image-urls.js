import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingImageUrls() {
  console.log('🔍 Searching for videos with image-to-video mode but missing image_url...\n');

  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('generation_mode', 'image-to-video')
    .is('image_url', null);

  if (error) {
    console.error('❌ Error fetching videos:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('✅ No videos need fixing!');
    return;
  }

  console.log(`📋 Found ${videos.length} videos to fix:\n`);

  let fixed = 0;
  let skipped = 0;

  for (const video of videos) {
    const imageUrl = video.metadata?.product_data?.image_url;

    console.log(`📹 Video: ${video.id.substring(0, 8)}...`);
    console.log(`   Title: ${video.title || 'Untitled'}`);
    console.log(`   Model: ${video.kie_model}`);
    console.log(`   Status: ${video.status}`);

    if (!imageUrl) {
      console.log('   ⚠️  No image URL found in metadata.product_data.image_url - SKIPPED\n');
      skipped++;
      continue;
    }

    console.log(`   🖼️  Image URL: ${imageUrl.substring(0, 60)}...`);

    const { error: updateError } = await supabase
      .from('videos')
      .update({ image_url: imageUrl })
      .eq('id', video.id);

    if (updateError) {
      console.log(`   ❌ Error updating: ${updateError.message}\n`);
      skipped++;
    } else {
      console.log('   ✅ Fixed!\n');
      fixed++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${videos.length}`);
}

fixMissingImageUrls().catch(console.error);
