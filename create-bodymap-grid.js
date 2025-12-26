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

function buildBodymapGridPrompt(influencer) {
  const profile = influencer.identity_profile || {};

  const ethnicity = profile.ethnicity || 'Latina';
  const facialTraits = profile.facial_traits || '';
  const hairDesc = profile.hair || 'Castanho Médio';
  const bodyDesc = profile.body || 'Atlético';
  const marksDesc = profile.marks || 'No distinctive marks';

  let tattoosDesc = 'No tattoos';
  let molesDesc = 'No moles';
  let scarsDesc = 'No scars';

  if (profile.body_marks) {
    if (profile.body_marks.tattoos && profile.body_marks.tattoos.length > 0) {
      tattoosDesc = profile.body_marks.tattoos.map(t =>
        `${t.size || 'medium'} ${t.style || 'tattoo'} on ${t.location}`
      ).join(', ');
    }

    if (profile.body_marks.moles && profile.body_marks.moles.length > 0) {
      const moleList = profile.body_marks.moles.map(m => m.location).filter(Boolean).join(', ');
      if (moleList) molesDesc = `Moles on: ${moleList}`;
    }

    if (profile.body_marks.scars && profile.body_marks.scars.length > 0) {
      scarsDesc = profile.body_marks.scars.map(s =>
        `${s.visibility || 'visible'} scar on ${s.location}`
      ).join(', ');
    }
  }

  return `Create a high-resolution CHARACTER IDENTITY MAP image.

The image must be a clean studio composite grid showing the SAME woman multiple times,
each panel documenting a specific physical aspect for long-term identity consistency.

REFERENCE IMAGE:
Use the provided reference image as the FACE AUTHORITY. Match the face EXACTLY.

STYLE & QUALITY:
- Ultra-realistic photography
- Neutral studio background (light gray)
- Soft, even studio lighting
- No dramatic shadows
- No artistic styling
- No fashion posing
- Documentary / reference style
- Clean, clinical, identity-focused

GRID LAYOUT (MANDATORY – SINGLE IMAGE):

Panel 1: Full body – front view
Panel 2: Full body – back view
Panel 3: Face close-up – neutral expression
Panel 4: Upper torso close-up (chest & abdomen)
Panel 5: Left arm close-up
Panel 6: Right arm close-up
Panel 7: Legs close-up (thighs & calves)
Panel 8: Back close-up (upper and lower back)
Panel 9: Detail panel highlighting permanent body marks

SUBJECT DESCRIPTION (LOCKED):

Gender: Female
Age: ${influencer.age || '19'}
Ethnicity: ${ethnicity}

Facial features: ${facialTraits}

Hair: ${hairDesc}

Body: ${bodyDesc}

PERMANENT BODY MARKS (CRITICAL – MUST MATCH EXACTLY):

Tattoos: ${tattoosDesc}
Moles: ${molesDesc}
Scars: ${scarsDesc}

All panels must depict the SAME person with PERFECT consistency.
This image will be used as a permanent identity reference for future image and video generation.

Do NOT:
- Change proportions between panels
- Add or remove marks
- Stylize the body
- Alter identity across panels
- Use artistic filters or effects

CRITICAL: Every panel shows the exact same woman with identical physical features, body proportions, and permanent marks.
This is a comprehensive identity documentation image, not a fashion or portrait photoshoot.`;
}

async function createBodymapGrid() {
  const influencerId = 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13';

  console.log('📥 Buscando dados da Maya...');

  const { data: influencer, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', influencerId)
    .single();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('✅ Maya encontrada');
  console.log('📸 Profile image URL:', influencer.profile_image_url);

  const bodymapPrompt = buildBodymapGridPrompt(influencer);

  console.log('\n📝 Prompt gerado:');
  console.log(bodymapPrompt.substring(0, 500) + '...\n');

  console.log('🚀 Criando bodymap grid no KIE...');

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nano-banana-pro',
      callBackUrl: `${supabaseUrl}/functions/v1/kie-callback`,
      input: {
        prompt: bodymapPrompt,
        aspect_ratio: '16:9',
        quality: 'high',
        reference_image: influencer.profile_image_url,
        reference_strength: 0.8
      }
    })
  });

  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    const taskId = data.data.taskId;
    console.log('✅ Bodymap grid task criado:', taskId);

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
      console.log('\nAguarde ~30-60s e rode:');
      console.log('node check-bodymap-status.js');
    }
  } else {
    console.error('❌ Erro na resposta do KIE:', data);
  }
}

createBodymapGrid().catch(console.error);
