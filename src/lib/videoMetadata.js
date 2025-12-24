export const getVideoMetadata = (videoUrl) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      video.remove();
      reject(new Error('Video metadata loading timeout'));
    }, 10000);

    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);

      let hasAudio = false;

      if (video.mozHasAudio !== undefined) {
        hasAudio = video.mozHasAudio;
      } else if (video.webkitAudioDecodedByteCount !== undefined) {
        hasAudio = video.webkitAudioDecodedByteCount > 0;
      } else if (video.audioTracks !== undefined && video.audioTracks.length > 0) {
        hasAudio = true;
      }

      setTimeout(() => {
        if (!hasAudio && video.webkitAudioDecodedByteCount !== undefined) {
          hasAudio = video.webkitAudioDecodedByteCount > 0;
        }

        const metadata = {
          duration: video.duration || 5,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          hasAudio: Boolean(hasAudio)
        };

        console.log('Video metadata detected:', {
          url: videoUrl.substring(0, 50) + '...',
          duration: metadata.duration,
          hasAudio: metadata.hasAudio,
          mozHasAudio: video.mozHasAudio,
          webkitAudioDecodedByteCount: video.webkitAudioDecodedByteCount,
          audioTracksLength: video.audioTracks?.length
        });

        resolve(metadata);
        video.remove();
      }, 100);
    });

    video.addEventListener('error', (e) => {
      clearTimeout(timeout);
      console.error('Error loading video metadata:', e);
      resolve({
        duration: 5,
        width: 1920,
        height: 1080,
        hasAudio: true
      });
      video.remove();
    });

    video.src = videoUrl;
    video.load();
  });
};

export const generateThumbnail = (videoUrl, seekTime = 0.5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(seekTime, video.duration - 0.1);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailUrl);

        video.remove();
        canvas.remove();
      } catch (error) {
        reject(new Error('Failed to generate thumbnail'));
        video.remove();
      }
    });

    video.addEventListener('error', (e) => {
      reject(new Error('Failed to load video for thumbnail'));
      video.remove();
    });

    video.src = videoUrl;
    video.load();
  });
};

export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
