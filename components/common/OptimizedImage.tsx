/**
 * Optimized Image Component for Vite/React
 * 
 * Features:
 * - Lazy loading by default
 * - Priority loading for LCP images
 * - Responsive sizes
 * - Error handling with fallback
 * - Loading skeleton
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean; // For LCP images
  sizes?: string; // Responsive sizes (e.g., "(max-width: 768px) 100vw, 50vw")
  width?: number;
  height?: number;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  sizes,
  width,
  height,
  fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%2318181b" width="400" height="400"/%3E%3C/svg%3E',
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    onError?.();
  };

  // Build responsive srcset if width/height provided
  const srcSet = width && height
    ? `${src}?w=${width}&h=${height} 1x, ${src}?w=${width * 2}&h=${height * 2} 2x`
    : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading Skeleton */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/5 animate-pulse"
        />
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes || '100vw'}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error State */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
          <p className="text-xs text-slate-500">Image non disponible</p>
        </div>
      )}
    </div>
  );
};
