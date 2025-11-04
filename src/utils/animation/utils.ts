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
    throttleAnimation: <T extends unknown[]>(fn: (...args: T) => void, delay = 16) => {
      let lastCall = 0;
      return (...args: T) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn(...args);
        }
      };
    },
  
    // Débounce pour les animations de redimensionnement
    debounceResize: <T extends unknown[]>(fn: (...args: T) => void, delay = 100) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: T) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
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
