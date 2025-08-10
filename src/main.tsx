import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/i18n';
import App from './App';
import './index.css';
import { ConfigProvider } from '@/contexts/ConfigContext';

// Debug des variables d'environnement au démarrage
console.log('🔧 Variables d\'environnement au démarrage:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configuré' : '❌ Non configuré');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Non configuré');
console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
console.log('MODE:', import.meta.env.MODE);
console.log('Toutes les variables VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// Configuration globale de l'application
const config = {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);