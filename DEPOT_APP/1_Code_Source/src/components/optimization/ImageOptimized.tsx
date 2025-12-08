// Composant d'image optimisée pour les performances
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'empty',
  sizes,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority) return; // Si prioritaire, charger immédiatement

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Charger 50px avant d'être visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    onError?.(event.nativeEvent);
  }, [onError]);

  // Générer les sources WebP si supporté
  const generateSources = useCallback(() => {
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const avifSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');

    return (
      <picture>
        <source srcSet={avifSrc} type="image/avif" sizes={sizes} />
        <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
        <img
          ref={imgRef}
          src={isInView ? src : undefined}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      </picture>
    );
  }, [src, alt, className, width, height, sizes, isInView, isLoaded, priority, handleLoad, handleError]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <span className="text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Placeholder pendant le chargement */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      
      {/* Image optimisée */}
      {generateSources()}
    </div>
  );
};

// Hook pour précharger les images critiques
export const useImagePreloader = () => {
  const preloadImage = useCallback((src: string, priority: 'high' | 'low' = 'low') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }

    document.head.appendChild(link);

    // Cleanup après 30 secondes
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 30000);
  }, []);

  const preloadImages = useCallback((images: Array<{ src: string; priority?: 'high' | 'low' }>) => {
    images.forEach(({ src, priority }) => {
      preloadImage(src, priority);
    });
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};

export default OptimizedImage;
