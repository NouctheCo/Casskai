// Composant pour gérer le CSS critique et améliorer les performances
import React, { useEffect } from 'react';

interface CriticalCSSProps {
  children: React.ReactNode;
}

// CSS critique pour le above-the-fold content
const CRITICAL_CSS = `
/* Critical CSS - Above the fold content */
.min-h-screen { min-height: 100vh; }
.bg-background { background-color: hsl(var(--background)); }
.text-foreground { color: hsl(var(--foreground)); }

/* Navigation critique */
.fixed { position: fixed; }
.top-0 { top: 0; }
.left-0 { left: 0; }
.right-0 { right: 0; }
.z-50 { z-index: 50; }

/* Loading states */
.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* Essential flex/grid */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

/* Essential spacing */
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.m-4 { margin: 1rem; }
.gap-4 { gap: 1rem; }

/* Essential text */
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }

/* Essential colors */
.text-primary { color: hsl(var(--primary)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.bg-primary { background-color: hsl(var(--primary)); }
.bg-muted { background-color: hsl(var(--muted)); }

/* Essential borders */
.border { border-width: 1px; }
.border-border { border-color: hsl(var(--border)); }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }

/* Essential transitions */
.transition-colors { 
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Hide elements not critical */
.non-critical { display: none !important; }
`;

export const CriticalCSS: React.FC<CriticalCSSProps> = ({ children }) => {
  useEffect(() => {
    // Injecter le CSS critique
    const criticalStyle = document.createElement('style');
    criticalStyle.textContent = CRITICAL_CSS;
    criticalStyle.setAttribute('data-critical', 'true');
    document.head.insertBefore(criticalStyle, document.head.firstChild);

    // Précharger les polices critiques
    const preloadFont = (href: string, type = 'woff2') => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'font';
      link.type = `font/${type}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // Précharger les polices système si nécessaire
    // preloadFont('/fonts/inter-var.woff2');

    return () => {
      // Cleanup
      const criticalStyles = document.querySelectorAll('[data-critical="true"]');
      criticalStyles.forEach(style => style.remove());
    };
  }, []);

  return <>{children}</>;
};

// Hook pour optimiser le chargement des ressources
export const useResourceOptimization = () => {
  useEffect(() => {
    // Preconnect aux domaines externes
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // DNS Prefetch pour les domaines tiers
    const dnsPrefetchDomains = [
      'https://api.supabase.co',
      'https://vitals.vercel-insights.com',
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Resource hints pour les modules critiques
    const modulePreloads = [
      '/src/components/ui/button.tsx',
      '/src/components/ui/input.tsx',
      '/src/hooks/useWebVitals.ts',
    ];

    if (import.meta.env.DEV) {
      modulePreloads.forEach(module => {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = module;
        document.head.appendChild(link);
      });
    }
  }, []);
};

// Composant pour la gestion du chargement progressif
export const ProgressiveEnhancement: React.FC<{ 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const [isJSEnabled, setIsJSEnabled] = React.useState(false);

  useEffect(() => {
    setIsJSEnabled(true);
    
    // Marquer que JS est activé pour le CSS
    document.documentElement.classList.add('js-enabled');
    document.documentElement.classList.remove('no-js');
  }, []);

  if (!isJSEnabled && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default CriticalCSS;