import React, { useState } from 'react';

interface OptimizedImageProps {
  videoId: string;
  title: string;
  fallbackSrc: string;
  className?: string;
}

export function OptimizedImage({ videoId, title, fallbackSrc, className = "" }: OptimizedImageProps) {
  const [imgError, setImgError] = useState(false);

  // Use webp versions of mqdefault (320x180) and hqdefault (480x360).
  // This drastically reduces image sizes and leverages responsive browser selection.

  return (
    <picture>
      {!imgError && (
        <>
          <source 
            type="image/webp" 
            srcSet={`https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp 320w, https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp 480w`} 
            sizes="(max-width: 640px) 320px, 480px" 
          />
          <source 
            type="image/jpeg" 
            srcSet={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${videoId}/hqdefault.jpg 480w`} 
            sizes="(max-width: 640px) 320px, 480px" 
          />
        </>
      )}
      <img 
        src={imgError ? fallbackSrc : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title} 
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
      />
    </picture>
  );
}
