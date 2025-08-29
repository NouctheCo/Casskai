import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Configuration du préchargement intelligent
interface LazyComponentConfig {
  priority: 'high' | 'medium' | 'low';
  preloadCondition?: () => boolean;
  chunkName?: string;
}

// Utilitaire pour créer des composants lazy avec préchargement intelligent
export type Preloadable<T extends ComponentType<unknown>> = LazyExoticComponent<T> & { preload?: () => Promise<{ default: T }> };

export function createLazyComponent<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  config: LazyComponentConfig = { priority: 'medium' }
) : Preloadable<T> {
  const LazyComponent = lazy(() => {
    try {
      // Précharger si la condition est remplie
      if (config.preloadCondition?.()) {
        return factory();
      }
      
      // Délai stratégique selon la priorité
      const delay = {
        high: 0,
        medium: 100,
        low: 200
      }[config.priority] || 100;
      
      return new Promise<{ default: T }>((resolve, reject) => {
        setTimeout(() => {
          factory()
            .then(resolve)
            .catch(reject);
        }, delay);
      });
    } catch (error) {
      console.error('Error in lazy component factory:', error);
      throw error;
    }
  });

  // Méthode pour précharger manuellement
  (LazyComponent as Preloadable<T>).preload = () => factory();
  
  return LazyComponent as Preloadable<T>;
}
