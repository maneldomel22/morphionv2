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
    console.log("Prompt:", videoPrompt);

    const kieResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
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
    });

    const kieData = await kieResponse.json();

    if (kieData.code !== 200 || !kieData.data?.taskId) {
      const errorText = kieData.msg || kieData.message || "Unknown error";
      console.error("KIE API error:", errorText);
      throw new Error(`Failed to create intro video: ${errorText}`);
    }

    const taskId = kieData.data.taskId;

    console.log("Video task created:", taskId);

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
        intro_video_task_id: taskId,
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

    return new Response(
      JSON.stringify({
        success: true,
        influencer_id: influencer.id,
        task_id: taskId,
        status: 'creating_video',
        message: 'Influencer creation started. Video generation in progress.'
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