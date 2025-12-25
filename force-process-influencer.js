import { readFileSync } from 'fs';

// Read .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const influencerId = 'b257ab78-d7f4-4944-9ef6-0b20d578750f';

async function forceProcessInfluencer() {
  console.log('🔄 Forçando processamento da influencer...\n');
  console.log(`   ID: ${influencerId}\n`);

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/admin-process-influencer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ influencer_id: influencerId }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    console.log('✅ Processamento iniciado com sucesso!\n');
    console.log('📋 Resultado:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

forceProcessInfluencer();
