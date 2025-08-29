// Déclarations de types pour les modules de test

declare module 'axe-playwright' {
  import { Page } from '@playwright/test';
  
  export function injectAxe(page: Page): Promise<void>;
  export function checkA11y(page: Page, context?: any, options?: any): Promise<void>;
  export function getViolations(page: Page): Promise<any[]>;
}

declare module 'lighthouse' {
  export interface LighthouseResult {
    lhr: {
      audits: Record<string, any>;
      categories: Record<string, any>;
    };
  }
  
  export interface Flags {
    output: string;
    onlyCategories?: string[];
    settings?: Record<string, any>;
  }
  
  export interface RunnerResult {
    lhr?: {
      audits: Record<string, any>;
      categories: Record<string, any>;
    };
  }
  
  export default function lighthouse(url: string, flags?: Flags): Promise<RunnerResult>;
}

// Déclarations globales pour les tests
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
    }
  }
  
  // Ajout des propriétés Vite à ImportMeta
  interface ImportMeta {
    env: {
      NODE_ENV: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  }
}

export {};