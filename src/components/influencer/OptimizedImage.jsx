import { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '../../lib/imageUtils';

export default function OptimizedImage({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  onLoad,
  aspectRatio = 'square',
  thumbnail = false,
  thumbnailSize = 200
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    video: 'aspect-[9/16]'
  };

  const optimizedSrc = thumbnail
    ? getOptimizedImageUrl(src, {
        width: thumbnailSize,
        height: thumbnailSize,
        quality: 80,
        format: 'webp'
      })
    : src;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${placeholderClassName}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      )}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          loading="lazy"
        />
      )}
    </div>
  );
}
