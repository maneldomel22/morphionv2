import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function translateText(supabase: any, text: string): Promise<string> {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text;
  }

  try {
    const { data, error } = await supabase.functions.invoke('morphy-hot-translate', {
      body: { text: text.trim() }
    });

    if (error) {
      console.error('Translation error:', error);
      return text;
    }

    return data?.translation || text;
  } catch (err) {
    console.error('Translation service error:', err);
    return text;
  }
}

async function translateObject(supabase: any, obj: any): Promise<any> {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && value.trim()) {
      console.log(`  Translating ${key}: "${value}"`);
      result[key] = await translateText(supabase, value);
      console.log(`    -> "${result[key]}"`);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = await Promise.all(value.map(async (item: any) => {
          if (typeof item === 'object') {
            return await translateObject(supabase, item);
          }
          return typeof item === 'string' ? await translateText(supabase, item) : item;
        }));
      } else {
        result[key] = await translateObject(supabase, value);
      }
    }
  }

  return result;
}

async function translateIdentityProfile(supabase: any, profile: any): Promise<any> {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const translated = JSON.parse(JSON.stringify(profile));

  if (translated.face) {
    console.log('Translating face...');
    translated.face = await translateObject(supabase, translated.face);
  }

  if (translated.hair) {
    console.log('Translating hair...');
    translated.hair = await translateObject(supabase, translated.hair);
  }

  if (translated.body) {
    console.log('Translating body...');
    translated.body = await translateObject(supabase, translated.body);
  }

  if (translated.skin) {
    console.log('Translating skin...');
    translated.skin = await translateObject(supabase, translated.skin);
  }

  if (translated.body_marks) {
    console.log('Translating body_marks...');
    translated.body_marks = await translateObject(supabase, translated.body_marks);
  }

  if (translated.distinctive_marks) {
    console.log('Translating distinctive_marks...');
    translated.distinctive_marks = await translateObject(supabase, translated.distinctive_marks);
  }

  if (translated.style && typeof translated.style === 'string') {
    console.log('Translating style...');
    translated.style = await translateText(supabase, translated.style);
  }

  return translated;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting translation of all influencers...\n');

    const { data: influencers, error } = await supabaseClient
      .from('influencers')
      .select('id, name, identity_profile');

    if (error) {
      console.error('❌ Error fetching influencers:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch influencers', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const influencersWithProfile = influencers?.filter((i: any) => i.identity_profile) || [];
    console.log(`📊 Found ${influencersWithProfile.length} influencers to translate\n`);

    const results = [];

    for (let i = 0; i < influencersWithProfile.length; i++) {
      const influencer = influencersWithProfile[i];
      console.log(`\n[${i + 1}/${influencersWithProfile.length}] Processing: ${influencer.name} (${influencer.id})`);
      console.log('─'.repeat(60));

      try {
        const translatedProfile = await translateIdentityProfile(supabaseClient, influencer.identity_profile);

        const { error: updateError } = await supabaseClient
          .from('influencers')
          .update({ identity_profile: translatedProfile })
          .eq('id', influencer.id);

        if (updateError) {
          console.error(`❌ Error updating influencer ${influencer.name}:`, updateError);
          results.push({ id: influencer.id, name: influencer.name, success: false, error: updateError });
        } else {
          console.log(`✅ Successfully translated ${influencer.name}`);
          results.push({ id: influencer.id, name: influencer.name, success: true });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error processing influencer ${influencer.name}:`, error);
        results.push({ id: influencer.id, name: influencer.name, success: false, error: String(error) });
      }
    }

    console.log('\n\n✨ Translation complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Translated ${results.filter(r => r.success).length} out of ${results.length} influencers`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});