const KIE_API_KEY = '0a30cb34de4ec530f2d30fd705fe982f';

const bodymapPrompt = `Full body reference photo for character consistency.

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

SUBJECT:
Latina woman, 19 years old.
Face: Latina, Morena skin, Mel Redondos eyes, Oval face shape, Médio nose, Carnudos lips, Confiante expression
Hair: Castanho Médio Levemente Ondulado Rabo de Cavalo
Body: Atlético, Média (160-170cm), Equilibradas proportions, Médios shoulders, Fina waist, Muito Largos hips, Torneadas legs, Levemente Inclinada posture
Body marks: No distinctive marks

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

async function createBodymap() {
  console.log('🚀 Criando bodymap no KIE...');

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
        aspect_ratio: '9:16',
        quality: 'high',
        reference_image: 'https://tempfile.aiquickdraw.com/nano3/1766716482045-g9eq31c1bko.jpg',
        reference_strength: 0.8
      }
    })
  });

  const data = await response.json();
  console.log('📦 Resposta do KIE:', JSON.stringify(data, null, 2));

  if (data.code === 200 && data.data?.taskId) {
    console.log('✅ Task ID:', data.data.taskId);
    console.log('\nAgora rode:');
    console.log(`UPDATE influencers SET bodymap_task_id = '${data.data.taskId}' WHERE id = 'f78bc4f8-a8c8-4bec-af00-b6b1915f0c13';`);
  }
}

createBodymap().catch(console.error);
