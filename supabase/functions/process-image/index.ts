import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;
const MAX_FILE_SIZE_MB = 10;

interface ProcessImageRequest {
  imageUrl: string;
  maxDimension?: number;
  quality?: number;
}

async function downloadImage(url: string): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProcessor/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to an image');
    }

    const blob = await response.blob();

    const sizeMB = blob.size / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
      console.log(`⚠️ Large image detected: ${sizeMB.toFixed(2)}MB`);
    }

    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Image download timeout (30s)');
    }
    throw error;
  }
}

async function resizeImage(
  blob: Blob,
  maxDimension: number,
  quality: number
): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const dataUrl = `data:${blob.type};base64,${btoa(
      String.fromCharCode(...uint8Array)
    )}`;

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = dataUrl;
  });

  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }

    canvas.width = width;
    canvas.height = height;
  }

  ctx.drawImage(img, 0, 0, width, height);

  const processedBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: quality,
  });

  return processedBlob;
}

async function uploadToTempStorage(
  blob: Blob,
  supabase: any,
  originalUrl: string
): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
  const filePath = `processed/${fileName}`;

  const { data, error } = await supabase.storage
    .from('temp-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    if (error.message?.includes('Bucket not found')) {
      const { error: createError } = await supabase.storage
        .createBucket('temp-images', {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE_MB * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

      if (createError) {
        console.error('Failed to create temp-images bucket:', createError);
        throw new Error('Storage not configured');
      }

      const { data: retryData, error: retryError } = await supabase.storage
        .from('temp-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (retryError) {
        throw retryError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('temp-images')
        .getPublicUrl(filePath);

      return publicUrl;
    }
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('temp-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const requestData: ProcessImageRequest = await req.json();

    if (!requestData.imageUrl) {
      throw new Error("imageUrl is required");
    }

    const maxDimension = requestData.maxDimension || MAX_DIMENSION;
    const quality = requestData.quality || JPEG_QUALITY;

    console.log(`📥 Processing image: ${requestData.imageUrl.substring(0, 100)}...`);

    const originalBlob = await downloadImage(requestData.imageUrl);
    const originalSizeMB = originalBlob.size / 1024 / 1024;

    console.log(`📊 Original size: ${originalSizeMB.toFixed(2)}MB`);

    const processedBlob = await resizeImage(originalBlob, maxDimension, quality);
    const processedSizeMB = processedBlob.size / 1024 / 1024;

    console.log(`📊 Processed size: ${processedSizeMB.toFixed(2)}MB (${((1 - processedSizeMB / originalSizeMB) * 100).toFixed(1)}% reduction)`);

    const publicUrl = await uploadToTempStorage(
      processedBlob,
      supabase,
      requestData.imageUrl
    );

    console.log(`✅ Image processed and uploaded: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        originalUrl: requestData.imageUrl,
        processedUrl: publicUrl,
        originalSize: originalSizeMB,
        processedSize: processedSizeMB,
        reduction: ((1 - processedSizeMB / originalSizeMB) * 100).toFixed(1) + '%',
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in process-image:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process image",
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