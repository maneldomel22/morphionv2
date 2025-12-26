import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const KIE_API_KEY = '0a30cb34de4ec530f2d30fd705fe982f';
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMayaBodymap() {
  const influencerId = 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13';

  console.log('📥 Buscando dados da Maya...');

  const { data: influencer, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', influencerId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar influencer:', error);
    return;
  }

  console.log('✅ Maya encontrada');
  console.log('📸 Profile image:', influencer.profile_image_url);

  const identity = influencer.identity_profile || {};

  const bodymapPrompt = `Full body reference photo for character consistency.

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

SUBJECT:
${identity.ethnicity || 'Latina'} woman, ${influencer.age || '19'} years old.
Face: ${identity.facial_traits || 'Latina, Morena skin, Mel Redondos eyes, Oval face shape, Médio nose, Carnudos lips, Confiante expression'}
Hair: ${identity.hair || 'Castanho Médio Levemente Ondulado Rabo de Cavalo'}
Body: ${identity.body || 'Atlético, Média (160-170cm), Equilibradas proportions'}
Body marks: ${identity.marks || 'none'}

POSE:
Standing straight. Arms slightly away from body. Neutral pose. Front-facing.

ATTIRE:
Form-fitting neutral clothing that shows body shape clearly. Tank top and fitted shorts.

BACKGROUND:
Plain solid neutral background. No props. No context.

LIGHTING:
Even soft lighting. Full body clearly visible. No harsh shadows.

PURPOSE:
This is a reference map for maintaining body consistency across future generations. Include all distinguishing marks and features.

STYLE:
Realistic. Natural. Clean reference photo quality.`;

  console.log('🚀 Criando bodymap no KIE...');

  const kieResponse = await fetch('https://api.kie.ai/api/v1/jobs/submitImagineJob', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: JSON.stringify({
        prompt: bodymapPrompt,
        aspect_ratio: '9:16',
        quality: 'high',
        reference_image: influencer.profile_image_url,
        reference_strength: 0.8
      }),
      model: 'nano-banana-pro',
      callBackUrl: `${supabaseUrl}/functions/v1/kie-callback`
    })
  });

  const kieData = await kieResponse.json();
  console.log('📦 Resposta do KIE:', JSON.stringify(kieData, null, 2));

  if (kieData.code === 200 && kieData.data?.taskId) {
    const taskId = kieData.data.taskId;
    console.log('✅ Bodymap task criado:', taskId);

    const { error: updateError } = await supabase
      .from('influencers')
      .update({
        bodymap_task_id: taskId,
        updated_at: new Date().toISOString()
      })
      .eq('id', influencerId);

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
    } else {
      console.log('✅ Influencer atualizado com bodymap_task_id');
    }
  } else {
    console.error('❌ Erro na resposta do KIE');
  }
}

createMayaBodymap().catch(console.error);
