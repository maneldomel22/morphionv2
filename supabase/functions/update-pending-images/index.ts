import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('status', 'generating')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`Found ${images.length} pending images`);

    const results = [];

    for (const image of images) {
      console.log(`Checking image ${image.id} with taskId ${image.task_id}`);

      try {
        const response = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${image.task_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${kieApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to check status for ${image.task_id}:`, response.status);
          results.push({
            id: image.id,
            taskId: image.task_id,
            status: 'error',
            message: `Failed to check status: ${response.status}`,
          });
          continue;
        }

        const data = await response.json();
        const status = data.data;

        console.log(`Image ${image.id} status: ${status.state}`);

        if (status.state === 'success') {
          let imageUrl = null;

          if (status.resultJson) {
            try {
              const resultData = JSON.parse(status.resultJson);
              if (resultData.resultUrls && resultData.resultUrls.length > 0) {
                imageUrl = resultData.resultUrls[0];
              }
            } catch (e) {
              console.error('Failed to parse resultJson:', e);
            }
          }

          if (imageUrl) {
            const { error: updateError } = await supabase
              .from('generated_images')
              .update({
                status: 'completed',
                image_url: imageUrl,
              })
              .eq('id', image.id);

            if (updateError) {
              console.error('Failed to update:', updateError);
              results.push({
                id: image.id,
                taskId: image.task_id,
                status: 'error',
                message: 'Failed to update database',
              });
            } else {
              console.log(`Updated image ${image.id}`);
              results.push({
                id: image.id,
                taskId: image.task_id,
                status: 'updated',
                imageUrl,
              });
            }
          } else {
            results.push({
              id: image.id,
              taskId: image.task_id,
              status: 'success_no_url',
              message: 'Success but no image URL found',
            });
          }
        } else if (status.state === 'fail') {
          const { error: updateError } = await supabase
            .from('generated_images')
            .update({
              status: 'failed',
              error_message: status.failMsg || 'Image generation failed',
            })
            .eq('id', image.id);

          if (updateError) {
            console.error('Failed to update:', updateError);
          }

          results.push({
            id: image.id,
            taskId: image.task_id,
            status: 'failed',
            message: status.failMsg || 'Image generation failed',
          });
        } else {
          results.push({
            id: image.id,
            taskId: image.task_id,
            status: status.state,
            message: 'Still processing or unknown state',
          });
        }
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        results.push({
          id: image.id,
          taskId: image.task_id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalChecked: images.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in update-pending-images:', error);

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