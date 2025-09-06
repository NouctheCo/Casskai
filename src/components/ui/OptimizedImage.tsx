import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  lazyLoad?: boolean;
  responsive?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Générateur d'URL d'image optimisée
const generateImageUrl = (
  src: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string => {
  // Si c'est une URL externe, retourner telle quelle
  if (src.startsWith('http') || src.startsWith('//')) {
    return src;
  }

  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Pour les images locales, on peut utiliser un service d'optimisation
  // Ici on simule une optimisation, dans un vrai projet vous utiliseriez
  // un service comme Cloudinary, ImageKit, ou un middleware Vite/Webpack
  
  let optimizedSrc = src;
  
  // Ajouter les paramètres d'optimisation
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality !== 80) params.set('q', quality.toString());
  if (format !== 'jpeg') params.set('f', format);
  
  if (params.toString()) {
    optimizedSrc += `?${  params.toString()}`;
  }

  return optimizedSrc;
};

// Détection du support WebP/AVIF
const detectImageSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
  };
};

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    quality = 80,
    priority = false,
    lazyLoad = true,
    responsive = true,
    fallback,
    className,
    onLoad,
    onError,
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [imageSupport] = useState(() => detectImageSupport());
    const [inView, setInView] = useState(!lazyLoad || priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Intersection Observer pour le lazy loading
    useEffect(() => {
      if (lazyLoad && !priority && imgRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
              setInView(true);
              observerRef.current?.disconnect();
            }
          },
          { 
            threshold: 0.1,
            rootMargin: '50px'
          }
        );

        observerRef.current.observe(imgRef.current);
      }

      return () => {
        observerRef.current?.disconnect();
      };
    }, [lazyLoad, priority]);

    // Générer les sources d'images optimisées
    const generateSources = () => {
      if (!inView) return [];

      const sources = [];
      
      // AVIF (meilleure compression)
      if (imageSupport.avif) {
        sources.push({
          srcSet: generateImageUrl(src, { width, height, quality, format: 'avif' }),
          type: 'image/avif'
        });
      }
      
      // WebP (bonne compression, support étendu)
      if (imageSupport.webp) {
        sources.push({
          srcSet: generateImageUrl(src, { width, height, quality, format: 'webp' }),
          type: 'image/webp'
        });
      }

      return sources;
    };

    // Gérer les tailles responsives
    const generateSizes = () => {
      if (!responsive) return undefined;
      
      // Tailles par défaut basées sur les breakpoints courants
      if (width) {
        return `(max-width: 640px) ${Math.min(width, 640)}px, ` +
               `(max-width: 768px) ${Math.min(width, 768)}px, ` +
               `(max-width: 1024px) ${Math.min(width, 1024)}px, ` +
               `${width}px`;
      }
      
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw';
    };

    // Gérer le chargement
    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    // Image de fallback
    const fallbackSrc = fallback || generatePlaceholder(width, height, alt);

    const sources = generateSources();
    const finalSrc = inView 
      ? (hasError ? fallbackSrc : generateImageUrl(src, { width, height, quality, format: 'jpeg' }))
      : generatePlaceholder(width, height, 'Loading...');

    return (
      <picture className={cn('block', className)}>
        {/* Sources optimisées */}
        {sources.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            type={source.type}
            sizes={generateSizes()}
          />
        ))}
        
        {/* Image de fallback */}
        <img
          ref={(node) => {
            imgRef.current = node;
            if (ref) {
              if (typeof ref === 'function') {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={generateSizes()}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'opacity-50'
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </picture>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Générateur de placeholder
const generatePlaceholder = (width?: number, height?: number, text = '') => {
  const imageWidth = width || 400;
  const imageHeight = height || 300;
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
            font-family="Arial, sans-serif" font-size="14" fill="#999">
        ${text || `${imageWidth}×${imageHeight}`}
      </text>
    </svg>
  `)}`;
};

// Hook pour précharger les images
export const useImagePreloader = () => {
  const preloadImage = (src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    formats?: ('webp' | 'avif' | 'jpeg')[];
  } = {}) => {
    const { formats = ['webp', 'avif', 'jpeg'] } = options;
    
    const promises = formats.map(format => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = generateImageUrl(src, { ...options, format });
      });
    });

    return Promise.allSettled(promises);
  };

  const preloadImages = (images: Array<{
    src: string;
    width?: number;
    height?: number;
    quality?: number;
  }>) => {
    return Promise.all(
      images.map(img => preloadImage(img.src, img))
    );
  };

  return { preloadImage, preloadImages };
};

// Composant Avatar optimisé
export const OptimizedAvatar = ({
  src,
  alt,
  size = 40,
  ...props
}: {
  src: string;
  alt: string;
  size?: number;
} & Omit<OptimizedImageProps, 'width' | 'height'>) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', props.className)}
      quality={90}
      responsive={false}
      {...props}
    />
  );
};

// Composant pour images de fond optimisées
export const OptimizedBackground = ({
  src,
  alt,
  children,
  className,
  ...imageProps
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
} & Omit<OptimizedImageProps, 'className'>) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => setImageLoaded(true)}
        {...imageProps}
      />
      {children && (
        <div className={cn(
          'relative z-10',
          !imageLoaded && 'opacity-0'
        )}>
          {children}
        </div>
      )}
    </div>
  );
};

// Composant galerie d'images optimisées
export const OptimizedGallery = ({
  images,
  columns = 3,
  gap = 4,
  className,
}: {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  return (
    <div 
      className={cn(
        `grid gap-${gap}`,
        `grid-cols-1 sm:grid-cols-2`,
        columns >= 3 && 'lg:grid-cols-3',
        columns >= 4 && 'xl:grid-cols-4',
        className
      )}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            'aspect-square overflow-hidden rounded-lg transition-transform hover:scale-105',
            !loadedImages.has(index) && 'animate-pulse bg-gray-200'
          )}
        >
          <OptimizedImage
            {...image}
            className="w-full h-full object-cover"
            onLoad={() => handleImageLoad(index)}
            quality={85}
          />
        </div>
      ))}
    </div>
  );
};