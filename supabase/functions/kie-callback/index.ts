import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface KieCallback {
  code: number;
  data: {
    taskId: string;
    state: 'success' | 'fail' | 'processing';
    resultUrls?: string[];
    failCode?: string;
    failMsg?: string;
  };
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: KieCallback = await req.json();

    console.log('Received KIE callback:', {
      code: payload.code,
      state: payload.data?.state,
      taskId: payload.data?.taskId,
    });

    if (payload.code === 501) {
      console.warn('Received failure callback from KIE (code 501)');
    }

    const { taskId, state, resultUrls, failCode, failMsg } = payload.data;

    const { data: video, error: findVideoError } = await supabase
      .from('videos')
      .select('*')
      .eq('kie_task_id', taskId)
      .maybeSingle();

    if (!video) {
      console.log('Video not found, searching for influencer post with taskId:', taskId);

      let post = null;

      const { data: posts, error: findPostsError } = await supabase
        .from('influencer_posts')
        .select('*')
        .eq('status', 'generating');

      if (findPostsError) {
        console.error('Error searching for posts:', findPostsError);
      } else {
        console.log(`Found ${posts?.length || 0} generating posts, searching for taskId match...`);

        post = posts?.find(p => {
          const metadata = p.metadata;
          if (!metadata) {
            console.log(`Post ${p.id}: no metadata`);
            return false;
          }

          const hasMatch = metadata.taskId === taskId;
          console.log(`Post ${p.id}: metadata.taskId="${metadata.taskId}" ${hasMatch ? '✅ MATCH' : '❌ no match'}`);
          return hasMatch;
        });
      }

      if (post) {
        console.log('Found influencer post for taskId:', taskId);

        if (state === 'success' && resultUrls && resultUrls.length > 0) {
          console.log('Processing success callback for influencer post:', post.id);

          const imageUrl = resultUrls[0];

          const { error: updateError } = await supabase
            .from('influencer_posts')
            .update({
              status: 'completed',
              image_url: imageUrl,
            })
            .eq('id', post.id);

          if (updateError) {
            console.error('Failed to update post:', updateError);
            throw updateError;
          }

          console.log('Influencer post marked as completed:', post.id);

          return new Response(
            JSON.stringify({ success: true, message: 'Post image completed' }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        } else if (state === 'fail') {
          console.error('Processing failure callback for influencer post:', post.id);

          const { error: updateError } = await supabase
            .from('influencer_posts')
            .update({
              status: 'failed',
              error_message: failMsg || 'Image generation failed',
            })
            .eq('id', post.id);

          if (updateError) {
            throw updateError;
          }

          console.log('Influencer post marked as failed:', post.id);

          return new Response(
            JSON.stringify({ success: true, message: 'Post marked as failed' }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      console.error('No video or post found for taskId:', taskId);
      return new Response(
        JSON.stringify({ success: false, error: 'Task not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (video.status === 'ready') {
      console.log('Video already marked as ready, ignoring duplicate callback');
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const logData: any = {
      video_id: video.id,
      kie_task_id: taskId,
      event_type: 'callback_received',
      event_data: {
        state,
        code: payload.code,
      },
    };

    if (state === 'success' && resultUrls && resultUrls.length > 0) {
      console.log('Processing success callback:', {
        video_id: video.id,
        result_urls_count: resultUrls.length,
      });

      const videoUrl = resultUrls[0];

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'ready',
          video_url: videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) {
        console.error('Failed to update video to ready:', updateError);
        throw updateError;
      }

      if (video.source_mode === 'influencer') {
        const { error: postUpdateError } = await supabase
          .from('influencer_posts')
          .update({
            video_url: videoUrl,
            status: 'completed'
          })
          .contains('metadata', { videoId: video.id });

        if (postUpdateError) {
          console.error('Failed to update influencer post:', postUpdateError);
        } else {
          console.log('Influencer post updated with video URL');
        }
      }

      logData.event_data.video_url = videoUrl;
      logData.event_type = 'status_updated';
      logData.event_data.new_status = 'ready';

      await supabase.from('video_generation_logs').insert(logData);

      console.log('Video marked as ready:', video.id);

      try {
        console.log('Attempting to generate thumbnail for video:', video.id);

        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        const arrayBuffer = await videoBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const tempVideoPath = `/tmp/video_${video.id}.mp4`;
        await Deno.writeFile(tempVideoPath, uint8Array);

        const ffmpegCmd = new Deno.Command("ffmpeg", {
          args: [
            "-i", tempVideoPath,
            "-ss", "00:00:00.100",
            "-vframes", "1",
            "-f", "image2pipe",
            "-vcodec", "mjpeg",
            "-q:v", "2",
            "pipe:1"
          ],
          stdout: "piped",
          stderr: "piped",
        });

        const { code, stdout, stderr } = await ffmpegCmd.output();

        if (code === 0 && stdout.length > 0) {
          const thumbnailFileName = `${video.id}-thumbnail-${Date.now()}.jpg`;
          const thumbnailPath = `${video.user_id}/${thumbnailFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('video-thumbnails')
            .upload(thumbnailPath, stdout, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('video-thumbnails')
              .getPublicUrl(thumbnailPath);

            await supabase
              .from('videos')
              .update({ thumbnail_url: publicUrl })
              .eq('id', video.id);

            console.log('Thumbnail generated and uploaded successfully:', publicUrl);
          } else {
            console.error('Failed to upload thumbnail:', uploadError);
          }
        } else {
          console.error('FFmpeg failed to generate thumbnail:', new TextDecoder().decode(stderr));
        }

        await Deno.remove(tempVideoPath).catch(() => {});
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed (non-fatal):', thumbnailError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as ready' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (state === 'fail') {
      console.error('Processing failure callback:', {
        video_id: video.id,
        fail_code: failCode,
        fail_msg: failMsg,
      });
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'failed',
          kie_fail_code: failCode || 'UNKNOWN',
          kie_fail_message: failMsg || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) {
        throw updateError;
      }

      if (video.source_mode === 'influencer') {
        const { error: postUpdateError } = await supabase
          .from('influencer_posts')
          .update({
            status: 'failed',
            error_message: failMsg || 'Video generation failed'
          })
          .contains('metadata', { videoId: video.id });

        if (postUpdateError) {
          console.error('Failed to update influencer post:', postUpdateError);
        } else {
          console.log('Influencer post marked as failed');
        }
      }

      logData.event_type = 'error_occurred';
      logData.event_data.fail_code = failCode;
      logData.event_data.fail_message = failMsg;

      await supabase.from('video_generation_logs').insert(logData);

      console.log('Video marked as failed:', video.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as failed' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (state === 'processing') {
      console.log('Processing status update callback:', {
        video_id: video.id,
        state: 'processing',
      });

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'processing',
        })
        .eq('id', video.id);

      if (updateError) {
        console.error('Failed to update video to processing:', updateError);
        throw updateError;
      }

      logData.event_type = 'status_updated';
      logData.event_data.new_status = 'processing';

      await supabase.from('video_generation_logs').insert(logData);

      console.log('Video marked as processing:', video.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as processing' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.warn('Callback received but no action taken:', {
      state,
      has_result_urls: !!(resultUrls && resultUrls.length > 0),
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Callback received' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in kie-callback:', {
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