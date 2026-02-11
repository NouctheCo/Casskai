/**
 * CassKai - Image Optimization Utilities
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Fonctionnalités:
 * - Lazy loading images avec Intersection Observer
 * - Formats modernes (WebP, AVIF) avec fallback
 * - Compression automatique
 * - Responsive images (srcset)
 * - Blur placeholder (LQIP)
 * - Progressive loading
 */

import { logger } from './logger';

export interface ImageOptimizationOptions {
  /** Largeurs pour srcset responsive */
  widths?: number[];
  /** Qualité de compression (0-100) */
  quality?: number;
  /** Formats à générer (ordre de priorité) */
  formats?: ('avif' | 'webp' | 'jpg' | 'png')[];
  /** Lazy loading activé */
  lazy?: boolean;
  /** Placeholder blur base64 */
  placeholder?: string;
  /** Alt text obligatoire (accessibilité) */
  alt: string;
  /** Classes CSS personnalisées */
  className?: string;
  /** Ratio d'aspect (ex: '16:9') */
  aspectRatio?: string;
}

/**
 * Générer srcset pour images responsive
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths
    .map((width) => {
      const url = baseUrl.includes('?')
        ? `${baseUrl}&w=${width}`
        : `${baseUrl}?w=${width}`;
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Générer sizes attribute pour images responsive
 */
export function generateSizes(breakpoints: { maxWidth: string; size: string }[]): string {
  return breakpoints
    .map((bp, index) => {
      if (index === breakpoints.length - 1) {
        return bp.size;
      }
      return `(max-width: ${bp.maxWidth}) ${bp.size}`;
    })
    .join(', ');
}

/**
 * Hook React pour lazy loading d'images
 */
export function useLazyImage(imageUrl: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              // Précharger l'image
              const image = new Image();
              image.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
                logger.debug('ImageOptimizer', 'Image loaded:', src);
              };
              image.onerror = () => {
                setHasError(true);
                logger.error('ImageOptimizer', 'Image load error:', src);
              };
              image.src = src;

              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Précharger 50px avant d'être visible
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [imageUrl]);

  return { imgRef, imageSrc, isLoaded, hasError };
}

/**
 * Composant Image optimisée
 */
import React from 'react';
import { cn } from './utils';

export interface OptimizedImageProps extends ImageOptimizationOptions {
  src: string;
  width?: number;
  height?: number;
  priority?: boolean; // Désactiver lazy loading pour images critiques (above-the-fold)
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  widths = [640, 750, 828, 1080, 1200, 1920],
  quality = 80,
  formats = ['webp', 'jpg'],
  lazy = true,
  placeholder,
  priority = false,
  aspectRatio,
  className,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Lazy loading avec Intersection Observer
  const { imageSrc, isLoaded: lazyLoaded } = useLazyImage(
    priority ? src : '', // Si priority, charger immédiatement
    placeholder
  );

  React.useEffect(() => {
    if (priority && imgRef.current) {
      // Images prioritaires: charger immédiatement sans lazy loading
      const img = imgRef.current;
      img.src = src;
    }
  }, [priority, src]);

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
    logger.debug('OptimizedImage', 'Image loaded successfully');
  }, [onLoad]);

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
      logger.error('OptimizedImage', 'Image load error:', src);
    },
    [src, onError]
  );

  // Calculer les dimensions avec aspect ratio
  const aspectRatioPadding = React.useMemo(() => {
    if (!aspectRatio) return undefined;
    const [w, h] = aspectRatio.split(':').map(Number);
    return `${(h / w) * 100}%`;
  }, [aspectRatio]);

  // Générer srcset pour images responsive
  const srcSet = React.useMemo(() => {
    if (widths.length === 0) return undefined;
    return generateSrcSet(src, widths);
  }, [src, widths]);

  // Sizes par défaut: mobile 100vw, tablet 50vw, desktop 33vw
  const sizes = React.useMemo(() => {
    return generateSizes([
      { maxWidth: '640px', size: '100vw' },
      { maxWidth: '1024px', size: '50vw' },
      { maxWidth: '1536px', size: '33vw' },
    ]);
  }, []);

  // Formats modernes avec fallback
  const renderPicture = () => {
    if (formats.length === 1) {
      return (
        <img
          ref={imgRef}
          src={priority ? src : undefined}
          data-src={!priority ? src : undefined}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'bg-gray-200 dark:bg-gray-800',
            className
          )}
        />
      );
    }

    return (
      <picture>
        {formats.includes('avif') && (
          <source
            type="image/avif"
            srcSet={srcSet?.replace(/\.(jpg|jpeg|png)/, '.avif')}
            sizes={sizes}
          />
        )}
        {formats.includes('webp') && (
          <source
            type="image/webp"
            srcSet={srcSet?.replace(/\.(jpg|jpeg|png)/, '.webp')}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={priority ? src : undefined}
          data-src={!priority ? src : undefined}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'bg-gray-200 dark:bg-gray-800',
            className
          )}
        />
      </picture>
    );
  };

  // Wrapper avec aspect ratio
  if (aspectRatio) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{ paddingBottom: aspectRatioPadding }}
      >
        {placeholder && !isLoaded && (
          <img
            src={placeholder}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
          />
        )}
        <div className="absolute inset-0">{renderPicture()}</div>
      </div>
    );
  }

  return (
    <>
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}
      {renderPicture()}
    </>
  );
}

/**
 * Générer placeholder LQIP (Low Quality Image Placeholder)
 */
export async function generatePlaceholder(
  imageUrl: string,
  width = 20,
  quality = 10
): Promise<string> {
  try {
    // Dans un environnement réel, cela devrait être fait côté serveur
    // Pour l'instant, retourner une couleur unie ou un gradient
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${width}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6' filter='url(%23b)'/%3E%3C/svg%3E`;
  } catch (error) {
    logger.error('ImageOptimizer', 'Failed to generate placeholder:', error);
    return '';
  }
}

/**
 * Précharger images critiques
 */
export function preloadImage(src: string, options?: { as?: string; type?: string }): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options?.as || 'image';
  link.href = src;

  if (options?.type) {
    link.type = options.type;
  }

  document.head.appendChild(link);

  logger.debug('ImageOptimizer', 'Image preloaded:', src);
}

/**
 * Hook pour précharger images au survol
 */
export function useImagePreload(imageUrls: string[]) {
  const [preloadedUrls, setPreloadedUrls] = React.useState<Set<string>>(new Set());

  const preload = React.useCallback(
    (url: string) => {
      if (preloadedUrls.has(url)) return;

      const img = new Image();
      img.src = url;

      setPreloadedUrls((prev) => new Set(prev).add(url));

      logger.debug('ImageOptimizer', 'Image preloaded on hover:', url);
    },
    [preloadedUrls]
  );

  return { preload };
}

/**
 * Wrapper pour images avec préchargement au survol
 */
export function ImageWithPreload({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  const { preload } = useImagePreload([src]);

  return (
    <div
      onMouseEnter={() => preload(src)}
      onFocus={() => preload(src)}
      className="inline-block"
    >
      <OptimizedImage src={src} alt={alt} className={className} {...props} />
    </div>
  );
}

/**
 * Utilitaire pour compresser images côté client
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
              logger.debug('ImageOptimizer', 'Image compressed:', {
                originalSize: file.size,
                compressedSize: blob.size,
                ratio: ((blob.size / file.size) * 100).toFixed(2) + '%',
              });
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Stats sur les images chargées
 */
export function getImageLoadingStats() {
  if (typeof performance === 'undefined') return null;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const images = resources.filter((r) => r.initiatorType === 'img' || r.initiatorType === 'image');

  const totalSize = images.reduce((sum, img) => sum + (img.transferSize || 0), 0);
  const totalDuration = images.reduce((sum, img) => sum + img.duration, 0);

  return {
    count: images.length,
    totalSize: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    avgDuration: images.length > 0 ? (totalDuration / images.length).toFixed(2) : 0,
    largestImages: images
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 5)
      .map((img) => ({
        name: img.name.split('/').pop(),
        size: `${((img.transferSize || 0) / 1024).toFixed(2)} KB`,
        duration: `${img.duration.toFixed(2)} ms`,
      })),
  };
}
