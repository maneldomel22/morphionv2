export async function generateThumbnailFromVideo(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        }, 'image/jpeg', 0.85);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    video.src = videoUrl;
  });
}

export async function extractThumbnailFromVideoUrl(videoUrl, seekTime = 0.1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    const timeoutId = setTimeout(() => {
      reject(new Error('Thumbnail generation timeout'));
    }, 30000);

    video.onloadedmetadata = () => {
      const targetTime = seekTime < 1 ? video.duration * seekTime : seekTime;
      video.currentTime = Math.min(targetTime, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        clearTimeout(timeoutId);

        const canvas = document.createElement('canvas');
        const maxWidth = 1280;
        const maxHeight = 720;

        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        }, 'image/jpeg', 0.85);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    video.src = videoUrl;
  });
}

export function formatVideoDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getVideoQualityLabel(width, height) {
  if (width >= 3840 || height >= 2160) return '4K';
  if (width >= 2560 || height >= 1440) return '2K';
  if (width >= 1920 || height >= 1080) return 'Full HD';
  if (width >= 1280 || height >= 720) return 'HD';
  return 'SD';
}
