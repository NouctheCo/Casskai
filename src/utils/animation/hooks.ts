import React from 'react';
import { ANIMATION_CONFIG } from './config';

// Interfaces for the browser's non-standard APIs
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

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
export const usePerformanceMode = () => {
  const [isLowPerf, setIsLowPerf] = React.useState(false);

  React.useEffect(() => {
    // Détecter la performance du device
    const connection = (navigator as NavigatorWithConnection).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Considérer comme faible performance si:
    // - Moins de 4 cœurs CPU
    // - Connexion lente
    // - Memory limitée
    const isLowPerformance = 
      hardwareConcurrency < 4 || 
      (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) ||
      ((performance as PerformanceWithMemory).memory && (performance as PerformanceWithMemory).memory.usedJSHeapSize > 50_000_000); // > 50MB

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
