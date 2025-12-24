import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface KIERecordInfo {
  code: number;
  data: {
    taskId: string;
    status: string;
    param: string;
    result?: any;
  };
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const kieApiKey = Deno.env.get('KIE_API_KEY');

    if (!kieApiKey) {
      throw new Error('KIE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing Authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { videoId } = await req.json();

    if (!videoId) {
      throw new Error('videoId is required');
    }

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (videoError || !video) {
      throw new Error('Video not found');
    }

    if (video.user_id !== user.id) {
      throw new Error('Unauthorized - Video does not belong to user');
    }

    if (!video.kie_task_id) {
      throw new Error('Video does not have a KIE taskId. Cannot retrieve original prompt from KIE.');
    }

    console.log('📡 Fetching original prompt from KIE for taskId:', video.kie_task_id);

    const kieResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
        },
      }
    );

    const kieResult: KIERecordInfo = await kieResponse.json();

    console.log('📡 KIE recordInfo response:', {
      code: kieResult.code,
      status: kieResult.data?.status,
      hasParam: !!kieResult.data?.param,
    });

    if (kieResult.code !== 200 || !kieResult.data) {
      const errorMessage = kieResult.message || 'Failed to fetch KIE record info';
      console.error('❌ KIE API error:', kieResult);
      throw new Error(errorMessage);
    }

    if (!kieResult.data.param) {
      throw new Error('KIE record does not contain param data');
    }

    let paramData;
    try {
      paramData = JSON.parse(kieResult.data.param);
    } catch (parseError) {
      console.error('❌ Failed to parse KIE param:', parseError);
      throw new Error('Failed to parse KIE param data');
    }

    console.log('✅ Successfully retrieved KIE prompt:', {
      model: paramData.model,
      promptLength: paramData.input?.prompt?.length || 0,
      aspectRatio: paramData.input?.aspect_ratio,
      nFrames: paramData.input?.n_frames,
      size: paramData.input?.size,
      hasImageUrls: !!paramData.input?.image_urls,
      hasShots: !!paramData.input?.shots,
    });

    const promptData = {
      originalPrompt: paramData.input?.prompt || null,
      model: paramData.model,
      aspectRatio: paramData.input?.aspect_ratio,
      nFrames: paramData.input?.n_frames,
      size: paramData.input?.size,
      removeWatermark: paramData.input?.remove_watermark,
      imageUrls: paramData.input?.image_urls || null,
      shots: paramData.input?.shots || null,
      isStoryboard: !!paramData.input?.shots,
      callbackUrl: paramData.callBackUrl,
    };

    return new Response(
      JSON.stringify({
        success: true,
        video: {
          id: video.id,
          title: video.title,
          kie_task_id: video.kie_task_id,
        },
        kieData: promptData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-kie-prompt:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
