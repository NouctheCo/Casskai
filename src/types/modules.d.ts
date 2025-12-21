// Déclarations pour modules sans types

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: any;
  export default content;
}

// Déclarations pour les modules spécifiques au projet
declare module '@/utils/*';
declare module '@/services/*';
declare module '@/components/*';
declare module '@/hooks/*';
declare module '@/contexts/*';
declare module '@/types/*';
declare module '@/lib/*';
declare module '@/pages/*';
declare module '@/api/*';

// Variables d'environnement Vite
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_ANALYTICS_ENABLED: string;
  readonly VITE_DEBUG_MODE: string;
  // Ajoutez d'autres variables d'environnement ici
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Types globaux utiles
declare global {
  interface Window {
    // Extensions possibles de l'objet window
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export {};
