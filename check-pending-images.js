import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const kieApiKey = envVars.KIE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImageStatus(taskId) {
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to check status for ${taskId}:`, response.status);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error checking status for ${taskId}:`, error.message);
    return null;
  }
}

async function updatePendingImages() {
  console.log('Fetching pending images...');

  const { data: images, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('status', 'generating')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching images:', error);
    return;
  }

  console.log(`Found ${images.length} pending images\n`);

  for (const image of images) {
    console.log(`\nChecking image ${image.id}...`);
    console.log(`  Task ID: ${image.task_id}`);
    console.log(`  Created: ${new Date(image.created_at).toLocaleString()}`);

    const status = await checkImageStatus(image.task_id);

    if (!status) {
      console.log('  ❌ Could not check status');
      continue;
    }

    console.log(`  Status: ${status.state}`);

    if (status.state === 'success') {
      let imageUrl = null;

      if (status.resultJson) {
        try {
          const resultData = JSON.parse(status.resultJson);
          if (resultData.resultUrls && resultData.resultUrls.length > 0) {
            imageUrl = resultData.resultUrls[0];
          }
        } catch (e) {
          console.error('  ❌ Failed to parse resultJson:', e.message);
        }
      }

      if (imageUrl) {
        console.log(`  ✅ Image ready: ${imageUrl.substring(0, 60)}...`);

        const { error: updateError } = await supabase
          .from('generated_images')
          .update({
            status: 'completed',
            image_url: imageUrl,
          })
          .eq('id', image.id);

        if (updateError) {
          console.error('  ❌ Failed to update:', updateError);
        } else {
          console.log('  ✅ Updated in database');
        }
      } else {
        console.log('  ⚠️ Success but no image URL found');
      }
    } else if (status.state === 'fail') {
      console.log(`  ❌ Failed: ${status.failMsg || 'Unknown error'}`);

      const { error: updateError } = await supabase
        .from('generated_images')
        .update({
          status: 'failed',
          error_message: status.failMsg || 'Image generation failed',
        })
        .eq('id', image.id);

      if (updateError) {
        console.error('  ❌ Failed to update:', updateError);
      } else {
        console.log('  ✅ Marked as failed in database');
      }
    } else if (status.state === 'processing') {
      console.log('  ⏳ Still processing...');
    } else {
      console.log(`  ⚠️ Unknown state: ${status.state}`);
    }
  }

  console.log('\n✅ Done!');
}

updatePendingImages().catch(console.error);
