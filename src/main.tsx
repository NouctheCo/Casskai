import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/i18n.ts';
import App from './App.tsx';
import './index.css';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { logger } from '@/utils/logger';

// Debug des variables d'environnement au démarrage (uniquement en mode développement)
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
  logger.warn('🔧 Variables d\'environnement au démarrage:');
  logger.warn('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configuré' : '❌ Non configuré');
  logger.warn('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Non configuré');
  logger.warn('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
  logger.warn('MODE:', import.meta.env.MODE);
  logger.warn('Toutes les variables VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
}

// Configuration globale de l'application
const _config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appUrl: import.meta.env.VITE_APP_URL,
  env: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
};

// Fonction pour initialiser le thème
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initialiser le thème avant le rendu
initializeTheme();

// Fonction pour gérer les erreurs des extensions tierces
function handleExtensionErrors() {
  const originalErrorHandler = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;

  const comesFromExtension = (value: unknown): boolean => {
    if (!value) {
      return false;
    }

    const serialized = typeof value === 'string'
      ? value
      : value instanceof Error
        ? `${value.stack ?? value.message ?? ''}`
        : String(value);

    return serialized.includes('chrome-extension://');
  };

  window.onerror = function(message, source, lineno, colno, error) {
    if (comesFromExtension(source) || comesFromExtension(error)) {
      logger.warn('?? Extension error ignored:', message);
      return true;
    }

    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }

    return false;
  };

  window.onunhandledrejection = function(event) {
    if (comesFromExtension(event.reason)) {
      logger.warn('?? Extension promise rejection ignored:', event.reason);
      event.preventDefault();
      return;
    }

    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };
}

// Initialiser la gestion des erreurs d'extensions
handleExtensionErrors();

  // Vérifier React avant de rendre
  try {
    // Vérification basique que React est chargé
    if (!React) {
      throw new Error('React is not properly loaded');
    }
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </React.StrictMode>
    );
  } catch (error) {
    logger.error('Failed to initialize React application:', error);
    
    // Fallback: Retry after a short delay
    setTimeout(() => {
      try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
          throw new Error('Root element not found');
        }
        
        ReactDOM.createRoot(rootElement).render(
          <React.StrictMode>
            <ConfigProvider>
              <App />
            </ConfigProvider>
          </React.StrictMode>
        );
      } catch (retryError) {
        logger.error('React initialization failed on retry:', retryError);
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
              <h1 style="color: #dc2626;">Erreur de chargement</h1>
              <p>L'application n'a pas pu se charger correctement.</p>
              <p>Veuillez rafraîchir la page ou vider le cache de votre navigateur.</p>
              <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Actualiser la page
              </button>
            </div>
          `;
        }
      }
    }, 100);
  }

