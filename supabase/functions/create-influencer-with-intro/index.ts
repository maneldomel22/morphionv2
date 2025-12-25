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
  const greetingText = data.language === 'pt-BR'
    ? `Oi, eu sou ${data.name} e sou sua nova influencer virtual.`
    : `Hi, I'm ${data.name} and I'm your new virtual influencer.`;

  return `UGC-style selfie video for influencer identity creation.

CHARACTER:
Name: ${data.name}
Age: ${data.age}
Ethnicity: ${data.ethnicity}
Face: ${data.facialTraits}
Hair: ${data.hair}
Body: ${data.body}
Marks: ${data.marks}

WARDROBE:
Casual Brazilian home outfit. Thin strap tank top, denim shorts. No branding.

SCENE:
Brazilian apartment. Natural daylight. Real domestic vibe.

CAMERA:
Vertical smartphone selfie (9:16). Front camera. Arm-length distance.

ACTION (10 seconds):
0-4s: She smiles at camera and says: "${greetingText}"
4-7s: She steps back slightly, turns around casually showing her body, relaxed natural movement.
7-10s: Comes back close to camera, holds direct eye contact, silent, minimal movement, clear face.

FINAL 3 SECONDS CRITICAL:
- Complete silence
- Neutral relaxed face
- Minimal to no movement
- Perfect face visibility
- Direct camera gaze

STYLE:
Raw UGC smartphone video. Natural lighting. No effects. No music. No text. No overlays. Realistic amateur selfie.`;
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