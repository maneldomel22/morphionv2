const KIE_API_KEY = '0a30cb34de4ec530f2d30fd705fe982f';

const influencer = {
  id: 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13',
  name: 'Maya',
  age: '19',
  profile_image_url: 'https://tempfile.aiquickdraw.com/nano3/1766716482045-g9eq31c1bko.jpg',
  identity_profile: {
    ethnicity: 'Latina',
    facial_traits: 'Latina, Morena skin, Mel Redondos eyes, Oval face shape, Médio nose, Carnudos lips, Confiante expression',
    hair: 'Castanho Médio Levemente Ondulado Rabo de Cavalo',
    body: 'Atlético, Média (160-170cm), Equilibradas proportions, Médios shoulders, Fina waist, Muito Largos hips, Torneadas legs, Levemente Inclinada posture',
    marks: 'No distinctive marks'
  }
};

const bodymapPrompt = `Create a high-resolution CHARACTER IDENTITY MAP image.

The image must be a clean studio composite grid showing the SAME woman multiple times,
each panel documenting a specific physical aspect for long-term identity consistency.

REFERENCE IMAGE:
Use the provided reference image as the FACE AUTHORITY. Match the face EXACTLY in all panels.

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
Age: ${influencer.age}
Ethnicity: ${influencer.identity_profile.ethnicity}

Facial features: ${influencer.identity_profile.facial_traits}

Hair: ${influencer.identity_profile.hair}

Body: ${influencer.identity_profile.body}

ATTIRE (CRITICAL):
Fitted sports top and short athletic shorts. The clothing must show body shape clearly and reveal potential body marks on arms, legs, torso, and back.

PERMANENT BODY MARKS:
${influencer.identity_profile.marks}

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

async function createBodymapGrid() {
  console.log('🚀 Criando bodymap grid no KIE...');
  console.log('📸 Usando referência:', influencer.profile_image_url);

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nano-banana-pro',
      callBackUrl: 'https://selmogfyeujesrayxrhs.supabase.co/functions/v1/kie-callback',
      input: {
        prompt: bodymapPrompt,
        aspect_ratio: '16:9',
        quality: 'high',
        image_input: [influencer.profile_image_url]
      }
    })
  });

  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    const taskId = data.data.taskId;
    console.log('✅ Bodymap grid task criado:', taskId);
    console.log('\nAtualize no banco:');
    console.log(`UPDATE influencers SET bodymap_task_id = '${taskId}' WHERE id = '${influencer.id}';`);
  } else {
    console.error('❌ Erro na resposta do KIE:', data);
  }
}

createBodymapGrid().catch(console.error);
