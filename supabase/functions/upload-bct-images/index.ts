import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BCT_IMAGES_BASE64 = [
  {
    name: "prancheta_1.png",
    data: ""
  },
  {
    name: "prancheta_1_copiar.png",
    data: ""
  },
  {
    name: "prancheta_1_copiar_2.png",
    data: ""
  },
  {
    name: "prancheta_1_copiar_3.png",
    data: ""
  },
  {
    name: "prancheta_1_copiar_4.png",
    data: ""
  },
  {
    name: "prancheta_1_copiar_5.png",
    data: ""
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("📤 Starting BCT images upload...");

    const uploadedUrls = [];

    for (const image of BCT_IMAGES_BASE64) {
      const response = await fetch(
        `https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/bcts/${image.name}`
      );

      if (!response.ok) {
        console.log(`❌ Could not fetch ${image.name}`);
        continue;
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const storagePath = `bct/${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from('reference-images')
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Error uploading ${image.name}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reference-images')
        .getPublicUrl(storagePath);

      console.log(`✅ Uploaded: ${image.name} -> ${publicUrl}`);
      uploadedUrls.push({ name: image.name, url: publicUrl });
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadedUrls
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in upload-bct-images:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
