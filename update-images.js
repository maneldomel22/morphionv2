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
const anonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('Updating pending images...\n');

const response = await fetch(`${supabaseUrl}/functions/v1/update-pending-images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
});

if (!response.ok) {
  console.error('Failed to update images:', response.status);
  const error = await response.text();
  console.error(error);
  process.exit(1);
}

const result = await response.json();

console.log(`✅ Checked ${result.totalChecked} images\n`);

result.results.forEach(r => {
  console.log(`Image ${r.id.substring(0, 8)}...`);
  console.log(`  Task: ${r.taskId}`);
  console.log(`  Status: ${r.status}`);
  if (r.imageUrl) {
    console.log(`  URL: ${r.imageUrl.substring(0, 60)}...`);
  }
  if (r.message) {
    console.log(`  Message: ${r.message}`);
  }
  console.log('');
});

console.log('Done!');
