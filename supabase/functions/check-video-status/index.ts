import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      throw new Error('Missing taskId parameter');
    }

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('kie_task_id', taskId)
      .maybeSingle();

    if (videoError || !video) {
      throw new Error('Video not found');
    }

    const kieResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
      },
    });

    const kieResult = await kieResponse.json();

    console.log('KIE status check response:', {
      http_status: kieResponse.status,
      response_code: kieResult.code,
      task_id: taskId,
    });

    // CRITICAL: Check the code field in JSON response, not just HTTP status
    if (kieResult.code !== 200) {
      const errorMessage = kieResult.msg || kieResult.message || 'Unknown error';
      console.error('KIE API error response:', kieResult);

      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: video.id,
          kie_task_id: taskId,
          event_type: 'polling_error',
          event_data: {
            kie_code: kieResult.code,
            kie_message: errorMessage,
          },
        });

      throw new Error(`KIE API Error (${kieResult.code}): ${errorMessage}`);
    }

    const kieData = kieResult.data;

    const { state, resultJson, failCode, failMsg, createTime, completeTime } = kieData;

    let resultUrls: string[] = [];
    if (state === 'success' && resultJson) {
      try {
        const parsedResult = JSON.parse(resultJson);
        resultUrls = parsedResult.resultUrls || [];
        console.log('Parsed result URLs:', { count: resultUrls.length, urls: resultUrls });
      } catch (error) {
        console.error('Failed to parse resultJson:', error, 'Raw resultJson:', resultJson);
      }
    }

    console.log('KIE task state:', {
      task_id: taskId,
      state,
      has_results: resultUrls.length > 0,
      fail_code: failCode,
      fail_msg: failMsg,
    });

    await supabase
      .from('video_generation_logs')
      .insert({
        video_id: video.id,
        kie_task_id: taskId,
        event_type: 'polling_check',
        event_data: {
          state,
          has_results: resultUrls.length > 0,
          fail_code: failCode,
          fail_msg: failMsg,
        },
      });

    if (state === 'success' && resultUrls.length > 0 && video.status !== 'ready' && video.status !== 'completed') {
      const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

      await supabase
        .from('videos')
        .update({
          status: 'ready',
          video_url: resultUrls[0],
          thumbnail_url: resultUrls[0],
          completed_at: completedAt,
        })
        .eq('id', video.id);

      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: video.id,
          kie_task_id: taskId,
          event_type: 'status_updated',
          event_data: {
            new_status: 'ready',
            video_url: resultUrls[0],
            complete_time: completeTime,
            updated_via: 'polling',
          },
        });
    } else if (state === 'fail' && video.status !== 'failed') {
      const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

      await supabase
        .from('videos')
        .update({
          status: 'failed',
          kie_fail_code: failCode || 'UNKNOWN',
          kie_fail_message: failMsg || 'Unknown error',
          completed_at: completedAt,
        })
        .eq('id', video.id);

      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: video.id,
          kie_task_id: taskId,
          event_type: 'error_occurred',
          event_data: {
            fail_code: failCode,
            fail_message: failMsg,
            updated_via: 'polling',
          },
        });
    } else if ((state === 'waiting' || state === 'queuing' || state === 'generating') && video.status === 'queued') {
      await supabase
        .from('videos')
        .update({
          status: 'processing',
        })
        .eq('id', video.id);
    }

    const { data: updatedVideo } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        video: updatedVideo,
        kieState: state,
        data: kieData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in check-video-status:', {
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