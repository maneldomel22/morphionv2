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
    const kieApiKey = Deno.env.get('KIE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { postId } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ success: false, error: 'postId is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Checking status for influencer post:', postId);

    const { data: post, error: postError } = await supabase
      .from('influencer_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      console.error('Post not found:', postId);
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const taskId = post.metadata?.taskId;
    if (!taskId) {
      console.error('No taskId in post metadata:', postId);
      return new Response(
        JSON.stringify({ success: false, error: 'No taskId found in post metadata' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Querying KIE API for taskId:', taskId);

    const kieResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
        },
      }
    );

    if (!kieResponse.ok) {
      console.error('KIE API error:', kieResponse.status, kieResponse.statusText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to query KIE API' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const kieData = await kieResponse.json();

    console.log('KIE API response:', {
      code: kieData.code,
      state: kieData.data?.state,
      taskId: kieData.data?.taskId,
    });

    if (kieData.code !== 200) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'KIE API returned error',
          kieCode: kieData.code,
          message: kieData.message
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

    const state = kieData.data?.state;
    let resultUrls: string[] = [];

    if (kieData.data?.resultJson) {
      try {
        const resultData = typeof kieData.data.resultJson === 'string'
          ? JSON.parse(kieData.data.resultJson)
          : kieData.data.resultJson;

        resultUrls = resultData.resultUrls || [];
      } catch (e) {
        console.error('Failed to parse resultJson:', e);
      }
    }

    console.log('Task state:', state, 'Result URLs:', resultUrls.length);

    if (state === 'success' && resultUrls.length > 0) {
      const imageUrl = resultUrls[0];

      const { error: updateError } = await supabase
        .from('influencer_posts')
        .update({
          status: 'completed',
          image_url: imageUrl,
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Failed to update post:', updateError);
        throw updateError;
      }

      console.log('Post updated to completed with image URL');

      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          imageUrl,
          message: 'Post completed successfully'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (state === 'fail') {
      const failMsg = kieData.data?.failMsg || 'Generation failed';

      const { error: updateError } = await supabase
        .from('influencer_posts')
        .update({
          status: 'failed',
          error_message: failMsg,
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Failed to update post:', updateError);
        throw updateError;
      }

      console.log('Post marked as failed');

      return new Response(
        JSON.stringify({
          success: true,
          status: 'failed',
          error: failMsg,
          message: 'Post marked as failed'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      console.log('Post still in progress, state:', state);

      return new Response(
        JSON.stringify({
          success: true,
          status: state || 'generating',
          message: 'Post still generating'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Error in check-influencer-post:', {
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
