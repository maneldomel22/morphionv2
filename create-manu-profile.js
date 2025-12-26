import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://selmogfyeujesrayxrhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';
const supabase = createClient(supabaseUrl, supabaseKey);

const influencerId = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf';

// Build profile prompt based on Manu's identity
const profilePrompt = `Professional portrait photo.

SUBJECT:
Asiática woman, 22 years old.
Face: Asiática, Clara skin, Castanhos Amendoados eyes, Coração face shape, Fino nose, Médios lips, Neutra expression
Hair: Preto Médio Liso Franja
Body: Magro, Baixa (150-160cm), Equilibradas proportions

FRAMING:
Close-up portrait. Head and shoulders only. No body below shoulders visible.

POSE:
Neutral relaxed expression. Direct eye contact with camera. Slight natural smile.

BACKGROUND:
Solid neutral background. Soft gradient or plain wall. No objects. No context.

LIGHTING:
Soft even lighting. No harsh shadows. Professional but natural.

STYLE:
Natural skin texture. No heavy filters. Realistic but polished. Professional headshot quality.

STRICT RULES:
- No body visible below shoulders
- No text or watermarks
- No props or objects
- Clean professional portrait only`;

console.log('Creating profile image for Manu...');

// Login first
const { data: { session }, error: loginError } = await supabase.auth.getSession();
if (loginError || !session) {
  console.error('Not authenticated. Please login first.');
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/functions/v1/influencer-image`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    influencerId: influencerId,
    prompt: profilePrompt,
    type: 'profile',
    aspectRatio: '1:1'
  })
});

const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));

if (data.task_id) {
  console.log('\nProfile task created:', data.task_id);
  console.log('Now updating influencer record...');
  
  const { error } = await supabase
    .from('influencers')
    .update({
      creation_status: 'creating_profile_image',
      creation_metadata: {
        language: 'pt-BR',
        started_at: new Date().toISOString(),
        profile_prompt: profilePrompt
      }
    })
    .eq('id', influencerId);
    
  if (error) {
    console.error('Error updating influencer:', error);
  } else {
    console.log('Influencer updated successfully');
  }
}
