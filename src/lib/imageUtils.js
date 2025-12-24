import { supabase } from './supabase';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function isValidImageType(mimeType) {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export async function convertImageToSupported(file) {
  if (!file || !file.name) {
    throw new Error('Arquivo inválido');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha na conversão da imagem'));
            return;
          }

          const fileName = file.name.replace(/\.[^.]+$/, '.png');
          const convertedFile = new File(
            [blob],
            fileName,
            { type: 'image/png' }
          );

          resolve(convertedFile);
        },
        'image/png',
        0.95
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar a imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
}

async function prepareImageFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Imagem muito grande. O tamanho máximo é 10MB.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Por favor, selecione um arquivo de imagem.');
  }

  if (isValidImageType(file.type)) {
    return { file, converted: false };
  }

  const convertedFile = await convertImageToSupported(file);

  if (convertedFile.size > MAX_FILE_SIZE) {
    throw new Error('Imagem muito grande após conversão. Tente uma imagem menor.');
  }

  return { file: convertedFile, converted: true };
}

export async function prepareImageForUpload(file, bucketName = 'images') {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado');
  }
  return uploadImageToStorage(file, bucketName);
}

async function setupStorageBucket() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || supabaseAnonKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/setup-storage-buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function uploadImageToStorage(file, bucketName = 'images') {
  const { file: processedFile } = await prepareImageFile(file);

  const fileExt = processedFile.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, processedFile);

  if (error) {
    if (error.message && error.message.includes('Bucket not found')) {
      const setupSuccess = await setupStorageBucket();

      if (setupSuccess) {
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, processedFile);

        if (retryError) {
          throw new Error(`Erro ao fazer upload: ${retryError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return publicUrl;
      } else {
        throw new Error('Erro ao configurar armazenamento. Tente novamente.');
      }
    }
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

export function getOptimizedImageUrl(url, options = {}) {
  if (!url) return url;

  const {
    width = null,
    height = null,
    quality = 75,
    format = 'webp'
  } = options;

  try {
    const urlObj = new URL(url);

    if (!urlObj.hostname.includes('supabase')) {
      return url;
    }

    const params = new URLSearchParams();

    if (width) params.append('width', width);
    if (height) params.append('height', height);
    params.append('quality', quality);
    if (format) params.append('format', format);

    const separator = urlObj.search ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  } catch (error) {
    return url;
  }
}

export function getThumbnailUrl(url, size = 200) {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    quality: 80,
    format: 'webp'
  });
}
