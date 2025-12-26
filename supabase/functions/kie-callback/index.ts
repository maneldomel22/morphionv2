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
      console.log('Video not found, searching for generated image with taskId:', taskId);

      const { data: image, error: findImageError } = await supabase
        .from('generated_images')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      if (image) {
        console.log('Found generated image for taskId:', taskId);

        if (state === 'success' && resultUrls && resultUrls.length > 0) {
          console.log('Processing success callback for generated image:', image.id);

          const imageUrl = resultUrls[0];

          const { error: updateError } = await supabase
            .from('generated_images')
            .update({
              status: 'completed',
              image_url: imageUrl,
            })
            .eq('id', image.id);

          if (updateError) {
            console.error('Failed to update image:', updateError);
            throw updateError;
          }

          console.log('Generated image marked as completed:', image.id);

          return new Response(
            JSON.stringify({ success: true, message: 'Image completed' }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        } else if (state === 'fail') {
          console.error('Processing failure callback for generated image:', image.id);

          const { error: updateError } = await supabase
            .from('generated_images')
            .update({
              status: 'failed',
              error_message: failMsg || 'Image generation failed',
            })
            .eq('id', image.id);

          if (updateError) {
            throw updateError;
          }

          console.log('Generated image marked as failed:', image.id);

          return new Response(
            JSON.stringify({ success: true, message: 'Image marked as failed' }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      console.log('Generated image not found, searching for influencer creation tasks');

      const { data: influencer } = await supabase
        .from('influencers')
        .select('*')
        .or(`intro_video_task_id.eq.${taskId},profile_image_task_id.eq.${taskId},bodymap_task_id.eq.${taskId}`)
        .maybeSingle();

      if (influencer) {
        console.log('Found influencer creation task for taskId:', taskId);

        if (state === 'success' && resultUrls && resultUrls.length > 0) {
          const imageUrl = resultUrls[0];

          if (influencer.profile_image_task_id === taskId) {
            console.log('Updating profile image for influencer:', influencer.id);
            const { error: updateError } = await supabase
              .from('influencers')
              .update({
                profile_image_url: imageUrl,
                creation_status: 'creating_bodymap',
              })
              .eq('id', influencer.id);

            if (updateError) throw updateError;

            return new Response(
              JSON.stringify({ success: true, message: 'Profile image completed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else if (influencer.bodymap_task_id === taskId) {
            console.log('Updating bodymap for influencer:', influencer.id);
            const { error: updateError } = await supabase
              .from('influencers')
              .update({
                bodymap_url: imageUrl,
                creation_status: 'ready',
              })
              .eq('id', influencer.id);

            if (updateError) throw updateError;

            return new Response(
              JSON.stringify({ success: true, message: 'Bodymap completed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else if (influencer.intro_video_task_id === taskId) {
            console.log('Updating intro video for influencer:', influencer.id);
            const { error: updateError } = await supabase
              .from('influencers')
              .update({
                intro_video_url: imageUrl,
              })
              .eq('id', influencer.id);

            if (updateError) throw updateError;

            return new Response(
              JSON.stringify({ success: true, message: 'Intro video completed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (state === 'fail') {
          console.error('Processing failure for influencer creation:', influencer.id);
          const { error: updateError } = await supabase
            .from('influencers')
            .update({
              creation_status: 'failed',
            })
            .eq('id', influencer.id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({ success: true, message: 'Influencer creation marked as failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('Influencer not found, searching for influencer post');

      let post = null;

      const { data: posts, error: findPostsError } = await supabase
        .from('influencer_posts')
        .select('*')
        .eq('status', 'generating');

      if (!findPostsError && posts) {
        post = posts.find(p => p.metadata?.taskId === taskId);
      }

      if (post) {
        console.log('Found influencer post for taskId:', taskId);

        if (state === 'success' && resultUrls && resultUrls.length > 0) {
          const imageUrl = resultUrls[0];

          const { error: updateError } = await supabase
            .from('influencer_posts')
            .update({
              status: 'completed',
              image_url: imageUrl,
            })
            .eq('id', post.id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({ success: true, message: 'Post image completed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (state === 'fail') {
          const { error: updateError } = await supabase
            .from('influencer_posts')
            .update({
              status: 'failed',
              error_message: failMsg || 'Image generation failed',
            })
            .eq('id', post.id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({ success: true, message: 'Post marked as failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.error('No video, image or post found for taskId:', taskId);
      return new Response(
        JSON.stringify({ success: false, error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (video.status === 'ready') {
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const logData: any = {
      video_id: video.id,
      kie_task_id: taskId,
      event_type: 'callback_received',
      event_data: { state, code: payload.code },
    };

    if (state === 'success' && resultUrls && resultUrls.length > 0) {
      const videoUrl = resultUrls[0];

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'ready',
          video_url: videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) throw updateError;

      if (video.source_mode === 'influencer') {
        await supabase
          .from('influencer_posts')
          .update({ video_url: videoUrl, status: 'completed' })
          .contains('metadata', { videoId: video.id });
      }

      logData.event_data.video_url = videoUrl;
      logData.event_type = 'status_updated';
      logData.event_data.new_status = 'ready';

      await supabase.from('video_generation_logs').insert(logData);

      try {
        const response = await fetch(videoUrl);
        if (response.ok) {
          const videoBlob = await response.blob();
          const arrayBuffer = await videoBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const tempVideoPath = `/tmp/video_${video.id}.mp4`;
          await Deno.writeFile(tempVideoPath, uint8Array);

          const ffmpegCmd = new Deno.Command("ffmpeg", {
            args: ["-i", tempVideoPath, "-ss", "00:00:00.100", "-vframes", "1", "-f", "image2pipe", "-vcodec", "mjpeg", "-q:v", "2", "pipe:1"],
            stdout: "piped",
            stderr: "piped",
          });

          const { code, stdout } = await ffmpegCmd.output();

          if (code === 0 && stdout.length > 0) {
            const thumbnailFileName = `${video.id}-thumbnail-${Date.now()}.jpg`;
            const thumbnailPath = `${video.user_id}/${thumbnailFileName}`;

            const { error: uploadError } = await supabase.storage
              .from('video-thumbnails')
              .upload(thumbnailPath, stdout, { contentType: 'image/jpeg', upsert: true });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('video-thumbnails')
                .getPublicUrl(thumbnailPath);

              await supabase
                .from('videos')
                .update({ thumbnail_url: publicUrl })
                .eq('id', video.id);
            }
          }

          await Deno.remove(tempVideoPath).catch(() => {});
        }
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed (non-fatal):', thumbnailError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as ready' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (state === 'fail') {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'failed',
          kie_fail_code: failCode || 'UNKNOWN',
          kie_fail_message: failMsg || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) throw updateError;

      if (video.source_mode === 'influencer') {
        await supabase
          .from('influencer_posts')
          .update({ status: 'failed', error_message: failMsg || 'Video generation failed' })
          .contains('metadata', { videoId: video.id });
      }

      logData.event_type = 'error_occurred';
      logData.event_data.fail_code = failCode;
      logData.event_data.fail_message = failMsg;

      await supabase.from('video_generation_logs').insert(logData);

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (state === 'processing') {
      const { error: updateError } = await supabase
        .from('videos')
        .update({ status: 'processing' })
        .eq('id', video.id);

      if (updateError) throw updateError;

      logData.event_type = 'status_updated';
      logData.event_data.new_status = 'processing';

      await supabase.from('video_generation_logs').insert(logData);

      return new Response(
        JSON.stringify({ success: true, message: 'Video marked as processing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in kie-callback:', error);

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});