import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  cacheSize: number;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  clearCache: (cacheName?: string) => Promise<void>;
  preloadUrls: (urls: string[]) => Promise<void>;
}

export const useServiceWorker = (): [ServiceWorkerState, ServiceWorkerActions] => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    cacheSize: 0,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Actions
  const register = async () => {
    if (!state.isSupported) {
      console.warn('Service Worker non supporté');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Toujours vérifier les mises à jour
      });

      setRegistration(reg);
      setState(prev => ({ ...prev, isRegistered: true }));

      // Écouter les mises à jour
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      console.log('✅ Service Worker enregistré');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  };

  const unregister = async () => {
    if (registration) {
      await registration.unregister();
      setState(prev => ({ ...prev, isRegistered: false }));
      console.log('🗑️ Service Worker désenregistré');
    }
  };

  const update = async () => {
    if (registration) {
      await registration.update();
      
      // Forcer l'activation du nouveau SW
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Recharger la page après activation
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    }
  };

  const clearCache = async (cacheName?: string) => {
    if (registration?.active) {
      registration.active.postMessage({
        type: 'CLEAR_CACHE',
        payload: { cacheName }
      });
      
      // Mettre à jour la taille du cache
      updateCacheSize();
      
      console.log(`🧹 Cache ${cacheName || 'tous'} vidé`);
    }
  };

  const preloadUrls = async (urls: string[]) => {
    if (registration?.active) {
      registration.active.postMessage({
        type: 'CACHE_URLS',
        payload: { urls }
      });
      
      console.log(`📦 Pré-chargement de ${urls.length} URLs`);
    }
  };

  const updateCacheSize = async () => {
    if (registration?.active) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          setState(prev => ({ ...prev, cacheSize: event.data.size }));
        }
      };

      registration.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    }
  };

  // Effects
  useEffect(() => {
    // Auto-enregistrer le Service Worker
    if (state.isSupported) {
      register();
    }

    // Écouter les changements de connexion
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Mettre à jour la taille du cache périodiquement
    const interval = setInterval(updateCacheSize, 60000); // Toutes les minutes
    return () => clearInterval(interval);
  }, [registration]);

  const actions: ServiceWorkerActions = {
    register,
    unregister,
    update,
    clearCache,
    preloadUrls,
  };

  return [state, actions];
};

// Hook pour les notifications de mise à jour
export const useUpdateNotification = () => {
  const [swState, swActions] = useServiceWorker();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (swState.updateAvailable) {
      setShowNotification(true);
    }
  }, [swState.updateAvailable]);

  const acceptUpdate = () => {
    swActions.update();
    setShowNotification(false);
  };

  const dismissUpdate = () => {
    setShowNotification(false);
  };

  return {
    showNotification,
    acceptUpdate,
    dismissUpdate,
  };
};

// Hook pour le statut offline
export const useOfflineStatus = () => {
  const [swState] = useServiceWorker();
  const [offlineActions, setOfflineActions] = useState<string[]>([]);

  const addOfflineAction = (action: string) => {
    setOfflineActions(prev => [...prev, action]);
  };

  const clearOfflineActions = () => {
    setOfflineActions([]);
  };

  const syncWhenOnline = async () => {
    if (swState.isOnline && offlineActions.length > 0) {
      console.log(`🔄 Synchronisation de ${offlineActions.length} actions`);
      
      // Ici vous pouvez implémenter la logique de sync
      // Par exemple, renvoyer les requêtes qui ont échoué
      
      clearOfflineActions();
    }
  };

  useEffect(() => {
    if (swState.isOnline) {
      syncWhenOnline();
    }
  }, [swState.isOnline]);

  return {
    isOnline: swState.isOnline,
    offlineActions,
    addOfflineAction,
    clearOfflineActions,
    syncWhenOnline,
  };
};

// Composant de notification de mise à jour
export const UpdateNotification = () => {
  const { showNotification, acceptUpdate, dismissUpdate } = useUpdateNotification();

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">Mise à jour disponible</h4>
          <p className="text-sm opacity-90 mt-1">Une nouvelle version de CassKai est prête.</p>
          <div className="flex space-x-2 mt-3">
            <button
              type="button"
              onClick={acceptUpdate}
              className="px-3 py-1 bg-white text-blue-500 text-sm rounded hover:bg-opacity-90 transition-colors"
            >
              Mettre à jour
            </button>
            <button
              type="button"
              onClick={dismissUpdate}
              className="px-3 py-1 text-sm border border-white border-opacity-50 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant d'indicateur offline
export const OfflineIndicator = () => {
  const { isOnline, offlineActions } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-indicator"
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium">Mode hors ligne</span>
      {offlineActions.length > 0 && (
        <span className="bg-orange-600 text-xs px-2 py-1 rounded-full">
          {offlineActions.length} en attente
        </span>
      )}
    </div>
  );
};