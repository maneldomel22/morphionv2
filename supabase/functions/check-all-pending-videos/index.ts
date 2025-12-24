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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: pendingVideos } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['queued', 'processing'])
      .not('kie_task_id', 'is', null);

    if (!pendingVideos || pendingVideos.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending videos', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const video of pendingVideos) {
      try {
        const kieResponse = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${kieApiKey}` },
          }
        );

        const kieResult = await kieResponse.json();

        console.log('KIE status check:', {
          taskId: video.kie_task_id,
          httpStatus: kieResponse.status,
          responseCode: kieResult.code,
        });

        if (kieResult.code !== 200) {
          const errorMessage = kieResult.msg || kieResult.message || 'Unknown error';
          console.error('KIE API error for task', video.kie_task_id, ':', errorMessage);
          
          await supabase
            .from('video_generation_logs')
            .insert({
              video_id: video.id,
              kie_task_id: video.kie_task_id,
              event_type: 'polling_error',
              event_data: {
                kie_code: kieResult.code,
                kie_message: errorMessage,
              },
            });

          results.push({ 
            taskId: video.kie_task_id, 
            error: `KIE API Error (${kieResult.code}): ${errorMessage}` 
          });
          continue;
        }

        const kieData = kieResult.data;
        const { state, resultJson, failCode, failMsg, completeTime } = kieData;

        let resultUrls: string[] = [];
        if (state === 'success' && resultJson) {
          try {
            const parsedResult = JSON.parse(resultJson);
            resultUrls = parsedResult.resultUrls || [];
          } catch (e) {
            console.error('Failed to parse resultJson:', e);
          }
        }

        if (state === 'success' && resultUrls.length > 0 && video.status !== 'ready') {
          const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

          const { error: updateError } = await supabase
            .from('videos')
            .update({
              status: 'ready',
              video_url: resultUrls[0],
              thumbnail_url: resultUrls[0],
              completed_at: completedAt,
            })
            .eq('id', video.id);

          if (updateError) {
            console.error('Failed to update video to ready:', updateError);
            results.push({ taskId: video.kie_task_id, error: updateError.message });
          } else {
            await supabase
              .from('video_generation_logs')
              .insert({
                video_id: video.id,
                kie_task_id: video.kie_task_id,
                event_type: 'status_updated',
                event_data: {
                  new_status: 'ready',
                  video_url: resultUrls[0],
                  complete_time: completeTime,
                  updated_via: 'bulk_polling',
                },
              });

            results.push({ taskId: video.kie_task_id, state, status: 'ready' });
          }
        } else if (state === 'fail' && video.status !== 'failed') {
          const completedAt = completeTime ? new Date(completeTime).toISOString() : new Date().toISOString();

          const { error: updateError } = await supabase
            .from('videos')
            .update({
              status: 'failed',
              kie_fail_code: failCode || 'UNKNOWN',
              kie_fail_message: failMsg || 'Unknown error',
              completed_at: completedAt,
            })
            .eq('id', video.id);

          if (updateError) {
            console.error('Failed to update video to failed:', updateError);
            results.push({ taskId: video.kie_task_id, error: updateError.message });
          } else {
            await supabase
              .from('video_generation_logs')
              .insert({
                video_id: video.id,
                kie_task_id: video.kie_task_id,
                event_type: 'error_occurred',
                event_data: {
                  fail_code: failCode,
                  fail_message: failMsg,
                  updated_via: 'bulk_polling',
                },
              });

            results.push({ taskId: video.kie_task_id, state, status: 'failed', error: failMsg });
          }
        } else if ((state === 'waiting' || state === 'queuing' || state === 'generating') && video.status === 'queued') {
          await supabase
            .from('videos')
            .update({ status: 'processing' })
            .eq('id', video.id);
          
          results.push({ taskId: video.kie_task_id, state, status: 'processing' });
        } else {
          results.push({ taskId: video.kie_task_id, state, status: video.status });
        }
      } catch (error) {
        console.error('Error checking video', video.kie_task_id, ':', error);
        results.push({ 
          taskId: video.kie_task_id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: pendingVideos.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking pending videos:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});