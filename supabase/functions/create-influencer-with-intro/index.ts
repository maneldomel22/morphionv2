import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateInfluencerRequest {
  name: string;
  age: string;
  ethnicity: string;
  facialTraits: string;
  hair: string;
  body: string;
  marks: string;
  language: string;
  mode?: string;
}

function buildIntroVideoPrompt(data: CreateInfluencerRequest): string {
  return `TECHNICAL HEADER:
A casual, selfie-style IPHONE 15 PRO front-camera vertical video (9:16), recorded handheld at arm's length, with subtle micro-jitters, natural exposure shifts, and realistic smartphone stabilization artifacts.

ENVIRONMENT (LOCKED — MUST FOLLOW EXACTLY):
Location: Sala de estar brasileira simples e bem iluminada
Details: Piso frio de cerâmica branca, sofá neutro, ventilador de pedestal plástico ao fundo
Lighting: Luz natural de janela lateral, suave e realista

This environment is FIXED.
Do NOT replace it.
Do NOT simplify it.
Do NOT generalize it.
The entire video must take place in this exact environment.

CHARACTER (IDENTITY LOCK):
Name: ${data.name}
Age: ${data.age} years old
Gender: female
Ethnicity: ${data.ethnicity}
Skin tone: Morena clara, textura real com poros visíveis
Hair: ${data.hair}
Face: ${data.facialTraits}
Expression base: Confiante e simpática

WARDROBE (CASUAL BR):
Blusa regata de alcinha branca simples.
Short jeans casual.
Visual confortável, típico de casa no Brasil.

CINEMATOGRAPHY:
Framing: Medium close-up (rosto e parte do tronco)
Camera angle: Eye-level
Lens: iPhone front camera (~24mm equivalent)
Camera movement: Leve balanço de mão apenas
No tripod.
Single continuous take.

ACTION & PERFORMANCE:
Creative style: Apresentação casual / UGC real
Sequence of actions (IMPORTANT — FOLLOW ORDER):

1) ${data.name} olha diretamente para a câmera e diz com naturalidade:
"Oi, eu sou a ${data.name}."

2) Após falar, ela dá um pequeno sorriso, dá um passo para trás,
se afasta levemente da câmera, vira o corpo de lado,
faz um pequeno giro casual (volta simples, natural).

3) Em seguida, ela se aproxima novamente da câmera,
segura o celular com firmeza,
olha diretamente para a lente
e permanece em SILÊNCIO absoluto por 3 segundos.

No cuts.
No scene changes.
Movimentos naturais, sem exagero.

LANGUAGE RULE (CRITICAL):
Speak ONLY in Portuguese (pt-BR).
Do NOT translate.
Do NOT mix languages.
Pronounce clearly and naturally.

TIMING RULES:
- Spoken dialogue must end within the first 4 seconds.
- Final 3 seconds MUST be silent.
- Total video duration: ~8–10 seconds.
- Never cut off speech mid-sentence.

AUDIO:
Clear smartphone microphone audio.
Slight natural room reverb.
No background music.
No noise effects.

QUALITY & AUTHENTICITY MODIFIERS:
smartphone selfie,
real UGC,
handheld realism,
minor digital noise,
imperfect framing,
raw Instagram-style footage.

NEGATIVE CONSTRAINTS:
No subtitles.
No captions.
No text overlays.
No logos.
No watermarks.
No CGI look.
No plastic skin.
No exaggerated gestures.
No studio lighting.
No generic environments.
No third person view.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const kieApiKey = Deno.env.get("KIE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !kieApiKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const requestData: CreateInfluencerRequest = await req.json();

    const videoPrompt = buildIntroVideoPrompt(requestData);

    console.log("Creating influencer with intro video...");
    console.log("Video Prompt:", videoPrompt);

    // Build profile image prompt
    const profilePrompt = `Professional portrait photo.

SUBJECT:
${requestData.ethnicity} woman, ${requestData.age} years old.
Face: ${requestData.facialTraits}
Hair: ${requestData.hair}
Body: ${requestData.body}

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

    console.log("Profile Prompt:", profilePrompt);

    // Create both video and profile image tasks simultaneously
    const [videoResponse, profileResponse] = await Promise.all([
      fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sora-2-text-to-video",
          input: {
            prompt: videoPrompt,
            aspect_ratio: "portrait",
            n_frames: "10",
            size: "standard",
            remove_watermark: true
          }
        }),
      }),
      fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nano-banana-pro",
          input: {
            prompt: profilePrompt,
            aspect_ratio: "1:1",
            quality: "high"
          }
        }),
      })
    ]);

    const videoData = await videoResponse.json();
    const profileData = await profileResponse.json();

    if (videoData.code !== 200 || !videoData.data?.taskId) {
      const errorText = videoData.msg || videoData.message || "Unknown error";
      console.error("KIE API error (video):", errorText);
      throw new Error(`Failed to create intro video: ${errorText}`);
    }

    if (profileData.code !== 200 || !profileData.data?.taskId) {
      const errorText = profileData.msg || profileData.message || "Unknown error";
      console.error("KIE API error (profile):", errorText);
      throw new Error(`Failed to create profile image: ${errorText}`);
    }

    const videoTaskId = videoData.data.taskId;
    const profileTaskId = profileData.data.taskId;

    console.log("Video task created:", videoTaskId);
    console.log("Profile task created:", profileTaskId);

    // First, create the influencer record
    const { data: influencer, error: insertError } = await supabase
      .from("influencers")
      .insert({
        user_id: user.id,
        name: requestData.name,
        username: requestData.name.toLowerCase().replace(/\s+/g, ''),
        image_url: '',
        age: requestData.age,
        mode: requestData.mode || 'safe',
        creation_status: 'creating_video',
        identity_profile: {
          ethnicity: requestData.ethnicity,
          facial_traits: requestData.facialTraits,
          hair: requestData.hair,
          body: requestData.body,
          marks: requestData.marks
        },
        creation_metadata: {
          language: requestData.language,
          video_prompt: videoPrompt,
          profile_prompt: profilePrompt,
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    console.log("Influencer created:", influencer.id);

    // Insert the video in the videos table
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        influencer_id: influencer.id,
        video_type: 'influencer_presentation',
        title: `${requestData.name} - Vídeo de Apresentação`,
        status: 'queued',
        kie_task_id: videoTaskId,
        video_model: 'sora-2-text-to-video',
        source_mode: 'influencer',
        dialogue: `Oi, eu sou a ${requestData.name}.`,
        aspect_ratio: '9:16',
        duration: '10s',
        metadata: {
          prompt: videoPrompt,
          identity_profile: influencer.identity_profile
        }
      })
      .select()
      .single();

    if (videoError) {
      console.error("Video insert error:", videoError);
      throw videoError;
    }

    console.log("Video record created:", video.id);

    // Insert the profile image in the generated_images table
    const { data: profileImage, error: profileError } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        influencer_id: influencer.id,
        image_type: 'influencer_profile',
        status: 'generating',
        task_id: profileTaskId,
        prompt: profilePrompt,
        original_prompt: profilePrompt,
        aspect_ratio: '1:1',
        image_model: 'nano_banana_pro',
        kie_model: 'nano-banana-pro',
        generation_mode: 'text-to-image'
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile image insert error:", profileError);
      throw profileError;
    }

    console.log("Profile image record created:", profileImage.id);

    // Update influencer with references
    await supabase
      .from("influencers")
      .update({
        presentation_video_id: video.id,
        profile_image_id: profileImage.id
      })
      .eq("id", influencer.id);

    return new Response(
      JSON.stringify({
        success: true,
        influencer_id: influencer.id,
        video_task_id: videoTaskId,
        profile_task_id: profileTaskId,
        status: 'creating_video',
        message: 'Influencer creation started. Video and profile image generation in progress.'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in create-influencer-with-intro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});