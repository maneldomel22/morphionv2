// Script para disparar bodymap da Manu manualmente

const SUPABASE_URL = 'https://selmogfyeujesrayxrhs.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU';

const influencerId = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf';

async function main() {
  console.log('Chamando process-bodymap para Manu...');

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/process-bodymap`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        influencer_id: influencerId
      })
    }
  );

  const data = await response.json();
  console.log('Resultado:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
