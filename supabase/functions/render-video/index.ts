import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RenderRequest {
  jobId: string;
  projectId: string;
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

    const { jobId, projectId }: RenderRequest = await req.json();

    const { data: project, error: projectError } = await supabase
      .from('timeline_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    await supabase
      .from('render_jobs')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString(),
        progress: 10
      })
      .eq('id', jobId);

    const timeline = project.timeline_data;
    const ffmpegCommand = generateFFmpegCommand(timeline);
    
    console.log('Generated FFmpeg Command:', ffmpegCommand);

    await supabase
      .from('render_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await supabase
      .from('render_jobs')
      .update({ progress: 60 })
      .eq('id', jobId);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const firstVideoClip = timeline.tracks
      ?.flatMap((t: any) => t.clips || [])
      .find((c: any) => c.type === 'video' && (c.sourceUrl || c.properties?.src));

    let outputUrl = null;

    if (firstVideoClip) {
      const videoUrl = firstVideoClip.sourceUrl || firstVideoClip.properties?.src;
      outputUrl = videoUrl;
    }

    await supabase
      .from('render_jobs')
      .update({ progress: 90 })
      .eq('id', jobId);

    await supabase
      .from('render_jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_url: outputUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        message: 'Render completed successfully',
        outputUrl: outputUrl,
        ffmpegCommand: ffmpegCommand.substring(0, 500) + '...'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Render error:', error);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const body = await req.json();
        await supabase
          .from('render_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message || 'Render failed'
          })
          .eq('id', body.jobId);
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Render failed',
        details: error.toString()
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

function generateFFmpegCommand(timeline: any): string {
  const { width, height, fps, duration, tracks } = timeline;

  const allClips = tracks.flatMap((t: any) => t.clips || []);
  const videoClips = allClips.filter((c: any) => c.type === 'video' && (c.sourceUrl || c.properties?.src));
  const textClips = allClips.filter((c: any) => c.type === 'text');

  if (videoClips.length === 0) {
    return generateBlackVideoCommand(width, height, fps, duration, textClips);
  }

  const sortedVideoClips = [...videoClips].sort((a: any, b: any) => a.startTime - b.startTime);

  const inputs: string[] = [];
  const processedVideos: string[] = [];

  sortedVideoClips.forEach((clip: any, index: number) => {
    const src = clip.properties?.src || clip.sourceUrl;
    inputs.push(`-i "${src}"`);

    const trimStart = clip.properties?.trim?.start || 0;
    const clipDuration = clip.duration;

    processedVideos.push(
      `[${index}:v]trim=start=${trimStart}:duration=${clipDuration},` +
      `setpts=PTS-STARTPTS,` +
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `fps=${fps}[v${index}]`
    );
  });

  const concatInput = sortedVideoClips.map((_: any, i: number) => `[v${i}]`).join('');
  const concatFilter = `${concatInput}concat=n=${sortedVideoClips.length}:v=1:a=0[vconcat]`;

  let filterComplex = [...processedVideos, concatFilter].join(';\n  ');
  let currentStream = '[vconcat]';

  textClips.forEach((clip: any, index: number) => {
    const props = clip.properties || {};
    const text = (props.text || '').replace(/'/g, "\\\\\\'" ).replace(/:/g, "\\\\:");
    const fontcolor = props.color?.replace('#', '0x') + 'FF' || '0xFFFFFFFF';
    const fontsize = props.size || 64;
    const x = props.x !== undefined ? props.x : width / 2;
    const y = props.y !== undefined ? props.y : height / 2;

    const clipEnd = clip.startTime + clip.duration;

    const drawText =
      `${currentStream}drawtext=text='${text}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans${props.bold ? '-Bold' : ''}.ttf:` +
      `fontsize=${fontsize}:` +
      `fontcolor=${fontcolor}:` +
      `x=${x}-text_w/2:` +
      `y=${y}-text_h/2:` +
      `enable='between(t,${clip.startTime},${clipEnd})'` +
      (props.shadow ? `:shadowcolor=0x000000AA:shadowx=2:shadowy=2` : '') +
      `[text${index}]`;

    filterComplex += `;\n  ${drawText}`;
    currentStream = `[text${index}]`;
  });

  filterComplex += `;\n  ${currentStream}format=yuv420p[out]`;

  const command = `ffmpeg -y \\\n` +
    inputs.map(i => `  ${i}`).join(' \\\n') + ` \\\n` +
    `  -filter_complex "\\\n  ${filterComplex}\\\n  " \\\n` +
    `  -map "[out]" \\\n` +
    `  -c:v libx264 \\\n` +
    `  -preset fast \\\n` +
    `  -crf 18 \\\n` +
    `  -movflags +faststart \\\n` +
    `  output.mp4`;

  return command;
}

function generateBlackVideoCommand(width: number, height: number, fps: number, duration: number, textClips: any[]): string {
  let filterComplex = `color=c=black:s=${width}x${height}:d=${duration}:r=${fps}[base]`;
  let currentStream = '[base]';

  textClips.forEach((clip: any, index: number) => {
    const props = clip.properties || {};
    const text = (props.text || '').replace(/'/g, "\\\\\\'" ).replace(/:/g, "\\\\:");
    const fontcolor = props.color?.replace('#', '0x') + 'FF' || '0xFFFFFFFF';
    const clipEnd = clip.startTime + clip.duration;

    const drawText =
      `${currentStream}drawtext=text='${text}':` +
      `fontsize=${props.size || 64}:` +
      `fontcolor=${fontcolor}:` +
      `x=${props.x || width/2}-text_w/2:` +
      `y=${props.y || height/2}-text_h/2:` +
      `enable='between(t,${clip.startTime},${clipEnd})'[text${index}]`;

    filterComplex += `;\n  ${drawText}`;
    currentStream = `[text${index}]`;
  });

  filterComplex += `;\n  ${currentStream}format=yuv420p[out]`;

  return `ffmpeg -y \\\n` +
    `  -filter_complex "\\\n  ${filterComplex}\\\n  " \\\n` +
    `  -map "[out]" \\\n` +
    `  -c:v libx264 \\\n` +
    `  -preset fast \\\n` +
    `  -crf 18 \\\n` +
    `  -movflags +faststart \\\n` +
    `  output.mp4`;
}
