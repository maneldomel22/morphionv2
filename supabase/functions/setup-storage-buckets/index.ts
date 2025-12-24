import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = {
      buckets_created: [],
      buckets_existed: [],
      errors: []
    };

    // List of buckets to create
    const bucketsToCreate = [
      {
        id: 'wan-images',
        name: 'wan-images',
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        id: 'images',
        name: 'images',
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        id: 'lipsync-videos',
        name: 'lipsync-videos',
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      },
      {
        id: 'lipsync-audios',
        name: 'lipsync-audios',
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']
      }
    ];

    // Try to create each bucket
    for (const bucketConfig of bucketsToCreate) {
      try {
        // Check if bucket exists
        const { data: existingBucket } = await supabase
          .storage
          .getBucket(bucketConfig.id);

        if (existingBucket) {
          results.buckets_existed.push(bucketConfig.id);
          console.log(`Bucket ${bucketConfig.id} already exists`);
        } else {
          // Create bucket
          const { data, error } = await supabase
            .storage
            .createBucket(bucketConfig.id, {
              public: bucketConfig.public,
              fileSizeLimit: bucketConfig.fileSizeLimit,
              allowedMimeTypes: bucketConfig.allowedMimeTypes
            });

          if (error) {
            console.error(`Error creating bucket ${bucketConfig.id}:`, error);
            results.errors.push({
              bucket: bucketConfig.id,
              error: error.message
            });
          } else {
            results.buckets_created.push(bucketConfig.id);
            console.log(`Successfully created bucket ${bucketConfig.id}`);
          }
        }
      } catch (err) {
        console.error(`Exception creating bucket ${bucketConfig.id}:`, err);
        results.errors.push({
          bucket: bucketConfig.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage setup completed. Note: Storage policies must be set via migrations.',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in setup-storage-buckets:', error);

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