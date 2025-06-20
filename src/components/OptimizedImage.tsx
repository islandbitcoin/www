import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Generate optimized image URLs (in production, use a CDN service)
  const getOptimizedSrc = (originalSrc: string, _size?: number) => {
    // For now, return original src
    // In production, this would return CDN URLs with size parameters
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src, width);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-caribbean-sand/20',
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder blur */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-caribbean-ocean/10 to-caribbean-sunset/10" />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-caribbean-sand/50">
          <div className="text-center">
            <span className="text-3xl">🏝️</span>
            <p className="mt-2 text-xs text-muted-foreground">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !isError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full object-cover'
          )}
        />
      )}
    </div>
  );
}

