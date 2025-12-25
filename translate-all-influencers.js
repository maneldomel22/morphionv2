import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://selmogfyeujesrayxrhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG1vZ2Z5ZXVqZXNyYXl4cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTAyNTcsImV4cCI6MjA3Njk4NjI1N30.oL-o4jF-sYjVTm3gBL0IKjStk46rUC_cd_XoxUhsKWU'
);

async function translateText(text) {
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

async function translateObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && value.trim()) {
      console.log(`  Translating ${key}: "${value}"`);
      result[key] = await translateText(value);
      console.log(`    -> "${result[key]}"`);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = await Promise.all(value.map(async (item) => {
          if (typeof item === 'object') {
            return await translateObject(item);
          }
          return typeof item === 'string' ? await translateText(item) : item;
        }));
      } else {
        result[key] = await translateObject(value);
      }
    }
  }

  return result;
}

async function translateIdentityProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const translated = JSON.parse(JSON.stringify(profile));

  if (translated.face) {
    console.log('Translating face...');
    translated.face = await translateObject(translated.face);
  }

  if (translated.hair) {
    console.log('Translating hair...');
    translated.hair = await translateObject(translated.hair);
  }

  if (translated.body) {
    console.log('Translating body...');
    translated.body = await translateObject(translated.body);
  }

  if (translated.skin) {
    console.log('Translating skin...');
    translated.skin = await translateObject(translated.skin);
  }

  if (translated.body_marks) {
    console.log('Translating body_marks...');
    translated.body_marks = await translateObject(translated.body_marks);
  }

  if (translated.distinctive_marks) {
    console.log('Translating distinctive_marks...');
    translated.distinctive_marks = await translateObject(translated.distinctive_marks);
  }

  if (translated.style && typeof translated.style === 'string') {
    console.log('Translating style...');
    translated.style = await translateText(translated.style);
  }

  return translated;
}

async function translateAllInfluencers() {
  console.log('🔄 Starting translation of all influencers...\n');

  const { data: influencers, error } = await supabase
    .from('influencers')
    .select('id, name, identity_profile');

  if (error) {
    console.error('❌ Error fetching influencers:', error);
    return;
  }

  console.log('Raw data:', influencers);

  const influencersWithProfile = influencers?.filter(i => i.identity_profile) || [];
  console.log(`📊 Found ${influencersWithProfile.length} influencers to translate\n`);

  for (let i = 0; i < influencersWithProfile.length; i++) {
    const influencer = influencersWithProfile[i];
    console.log(`\n[${i + 1}/${influencers.length}] Processing: ${influencer.name} (${influencer.id})`);
    console.log('─'.repeat(60));

    try {
      const translatedProfile = await translateIdentityProfile(influencer.identity_profile);

      const { error: updateError } = await supabase
        .from('influencers')
        .update({ identity_profile: translatedProfile })
        .eq('id', influencer.id);

      if (updateError) {
        console.error(`❌ Error updating influencer ${influencer.name}:`, updateError);
      } else {
        console.log(`✅ Successfully translated ${influencer.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error processing influencer ${influencer.name}:`, error);
    }
  }

  console.log('\n\n✨ Translation complete!');
}

translateAllInfluencers().catch(console.error);
