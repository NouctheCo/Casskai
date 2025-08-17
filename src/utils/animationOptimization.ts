import React from 'react';
import { MotionConfig } from 'framer-motion';

// Configuration globale des animations pour optimiser les performances
export const ANIMATION_CONFIG = {
  // Durées optimisées pour maintenir 60fps
  durations: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8
  },
  
  // Easings optimisés pour des transitions fluides
  easings: {
    spring: [0.23, 1, 0.32, 1],
    ease: [0.4, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeOut: [0.0, 0.0, 0.2, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    anticipate: [0.0, 0.0, 0.2, 1]
  },
  
  // Stagger delays pour les animations en série
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15
  },
  
  // Propriétés CSS performantes (évitent le repaint/reflow)
  performantProperties: [
    'transform',
    'opacity',
    'filter',
    'backdrop-filter'
  ],
  
  // Propriétés à éviter (causent repaint/reflow)
  expensiveProperties: [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'border'
  ]
};

// Variants d'animation optimisés
export const OPTIMIZED_VARIANTS = {
  // Fade in/out optimisé
  fade: {
    initial: { 
      opacity: 0,
      // Utilise will-change pour optimiser les performances
      willChange: 'opacity'
    },
    animate: { 
      opacity: 1,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast,
        ease: ANIMATION_CONFIG.easings.ease
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Scale optimisé pour les boutons et cartes
  scale: {
    initial: { 
      scale: 0.9,
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      scale: 0.95,
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Slide optimisé pour les pages
  slideUp: {
    initial: { 
      y: 20,
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      y: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_CONFIG.durations.normal,
        ease: ANIMATION_CONFIG.easings.ease
      }
    },
    exit: { 
      y: -20,
      opacity: 0,
      transition: { 
        duration: ANIMATION_CONFIG.durations.fast
      }
    }
  },

  // Container pour staggering
  container: {
    animate: {
      transition: {
        staggerChildren: ANIMATION_CONFIG.stagger.normal,
        delayChildren: 0.1
      }
    }
  },

  // Item pour staggering
  item: {
    initial: { 
      y: 20, 
      opacity: 0,
      willChange: 'transform, opacity'
    },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }
};

// Hook pour détecter si l'utilisateur préfère des animations réduites
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
};

// Hook pour détecter les performances faibles
type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

export const usePerformanceMode = () => {
  const [isLowPerf, setIsLowPerf] = React.useState(false);

  React.useEffect(() => {
    // Détecter la performance du device
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Considérer comme faible performance si:
    // - Moins de 4 cœurs CPU
    // - Connexion lente
    // - Memory limitée
    const isLowPerformance = 
      hardwareConcurrency < 4 || 
      (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) ||
      // Mémoire utilisée (API non standard, on protège l'accès)
      ((performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ?? 0) > 50_000_000; // > 50MB

    setIsLowPerf(isLowPerformance);
  }, []);

  return isLowPerf;
};

// Configuration adaptive des animations
export const useAdaptiveAnimations = () => {
  const prefersReduced = usePrefersReducedMotion();
  const isLowPerf = usePerformanceMode();

  const shouldReduceAnimations = prefersReduced || isLowPerf;

  return {
    // Durées adaptatives
    duration: shouldReduceAnimations ? 0.1 : ANIMATION_CONFIG.durations.normal,
    
    // Spring config adaptive
    spring: shouldReduceAnimations ? 
      { stiffness: 500, damping: 30 } : 
      { stiffness: 300, damping: 24 },
    
    // Stagger adaptive
    stagger: shouldReduceAnimations ? 
      ANIMATION_CONFIG.stagger.fast : 
      ANIMATION_CONFIG.stagger.normal,
    
    // Désactiver complètement si nécessaire
    enabled: !prefersReduced
  };
};

// Composant wrapper pour optimiser les animations
export const OptimizedMotion: React.FC<{
  children: React.ReactNode;
  reducedMotion?: boolean;
}> = ({ children, reducedMotion = false }) => {
  const adaptive = useAdaptiveAnimations();

  const props: Partial<React.ComponentProps<typeof MotionConfig>> = {
    transition: {
      duration: adaptive.duration,
      ease: ANIMATION_CONFIG.easings.ease,
    },
    reducedMotion: reducedMotion ? 'always' : (adaptive.enabled ? 'never' : 'user'),
  };

  return React.createElement(MotionConfig, props, children);
};

// Utilitaires de performance
export const performanceUtils = {
  // Précharger les animations critiques
  preloadAnimations: () => {
    // Forcer le navigateur à préparer les propriétés transform et opacity
    const warmupElement = document.createElement('div');
    warmupElement.style.cssText = `
      position: fixed;
      top: -9999px;
      transform: translateX(0px) translateY(0px) translateZ(0px);
      opacity: 0;
      will-change: transform, opacity;
    `;
    document.body.appendChild(warmupElement);
    
    // Nettoyer après un court délai
    setTimeout(() => {
      document.body.removeChild(warmupElement);
    }, 100);
  },

  // Batch les updates DOM pour éviter les reflows multiples
  batchDOMUpdates: (fn: () => void) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  },

  // Throttle pour les animations intensives
  throttleAnimation: <TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number = 16) => {
    let lastCall = 0;
    return (...args: TArgs) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(null, args);
      }
    };
  },

  // Débounce pour les animations de redimensionnement
  debounceResize: <TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number = 100) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: TArgs) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  }
};

// CSS-in-JS optimisé pour les animations
export const optimizedStyles = {
  // GPU acceleration
  willChange: {
    transform: { willChange: 'transform' },
    opacity: { willChange: 'opacity' },
    auto: { willChange: 'auto' }
  },
  
  // Force hardware acceleration
  gpu: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000
  },
  
  // Anti-aliasing pour les transformations
  smoothTransform: {
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    textRendering: 'optimizeLegibility' as const
  }
};

// Composant de monitoring des performances d'animation
type PerformanceIssue = { fps: number; timestamp: number; type: 'low-fps' };

export const AnimationPerformanceMonitor: React.FC<{
  enabled?: boolean;
  onPerformanceIssue?: (data: PerformanceIssue) => void;
}> = ({ enabled = process.env.NODE_ENV === 'development', onPerformanceIssue }) => {
  React.useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Alerte si FPS trop faible
        if (fps < 50 && onPerformanceIssue) {
          onPerformanceIssue({
            fps,
            timestamp: currentTime,
            type: 'low-fps'
          });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }, [enabled, onPerformanceIssue]);

  return null;
};