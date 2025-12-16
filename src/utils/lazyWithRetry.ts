import React, { ComponentType, lazy } from 'react';

/**
 * Enhanced lazy loading with retry logic for better reliability
 * Automatically retries failed chunk loads up to 3 times
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  retryDelay = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, _reject) => {
      const attemptLoad = async () => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const component = await componentImport();
            resolve(component);
            return;
          } catch (error) {
            lastError = error as Error;
            console.warn(
              `[Lazy Loading] Attempt ${attempt + 1}/${retries} failed for component:`,
              error
            );

            // Wait before retrying (exponential backoff)
            if (attempt < retries - 1) {
              await new Promise((resolveDelay) =>
                setTimeout(resolveDelay, retryDelay * Math.pow(2, attempt))
              );
            }
          }
        }

        // If all retries failed, show user-friendly error
        console.error('[Lazy Loading] All retry attempts failed:', lastError);
        
        // Return a simple error component without JSX
        const ErrorComponent = () => React.createElement('div', {
          className: 'flex flex-col items-center justify-center min-h-[400px] p-8 text-center',
          children: [
            React.createElement('div', { className: 'text-6xl mb-4', key: 'icon' }, '⚠️'),
            React.createElement('h2', {
              className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2',
              key: 'title'
            }, 'Erreur de chargement'),
            React.createElement('p', {
              className: 'text-gray-600 dark:text-gray-400 mb-6 max-w-md',
              key: 'message'
            }, 'Impossible de charger cette page. Veuillez vérifier votre connexion internet et réessayer.'),
            React.createElement('button', {
              onClick: () => window.location.reload(),
              className: 'px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors',
              key: 'button'
            }, 'Recharger la page')
          ]
        });
        
        resolve({
          default: ErrorComponent as unknown as T,
        });
      };

      attemptLoad().catch((error) => {
        console.error('[Lazy Loading] Fatal error:', error);
      });
    });
  });
}

/**
 * Preload a lazy component
 * Useful for prefetching routes the user is likely to visit
 */
export function preloadComponent(
  componentImport: () => Promise<{ default: ComponentType<unknown> }>
): void {
  componentImport().catch((error) => {
    console.warn('[Preload] Failed to preload component:', error);
  });
}

/**
 * Create a lazy component with preload capability
 */
export function lazyWithPreload<T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>
) {
  const LazyComponent = lazyWithRetry(componentImport);
  
  return {
    Component: LazyComponent,
    preload: () => preloadComponent(componentImport),
  };
}
