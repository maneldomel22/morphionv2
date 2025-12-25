import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

const images = [
  'prancheta_1.png',
  'prancheta_1_copiar.png',
  'prancheta_1_copiar_2.png',
  'prancheta_1_copiar_3.png',
  'prancheta_1_copiar_4.png',
  'prancheta_1_copiar_5.png'
];

async function uploadImages() {
  console.log('🚀 Starting BCT images upload...\n');

  const bucketName = 'reference-images';

  const uploadedUrls = [];

  for (const imageName of images) {
    try {
      const filePath = `./public/bcts/${imageName}`;
      const fileBuffer = readFileSync(filePath);

      const storagePath = `bct/${imageName}`;

      console.log(`📤 Uploading ${imageName}...`);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Error uploading ${imageName}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      console.log(`✅ Uploaded: ${publicUrl}\n`);
      uploadedUrls.push({ name: imageName, url: publicUrl });
    } catch (error) {
      console.error(`❌ Error processing ${imageName}:`, error.message);
    }
  }

  console.log('\n📋 Summary - All URLs:\n');
  uploadedUrls.forEach(({ name, url }) => {
    console.log(`${name}:`);
    console.log(`  ${url}\n`);
  });

  console.log('\n🎯 Array for code:\n');
  console.log('const bctImages = [');
  uploadedUrls.forEach(({ url }) => {
    console.log(`  '${url}',`);
  });
  console.log('];\n');

  return uploadedUrls;
}

uploadImages().catch(console.error);
