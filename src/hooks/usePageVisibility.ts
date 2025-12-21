/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Hook personnalisé pour détecter quand la page devient visible/invisible
 * Permet de recharger les données que quand l'utilisateur revient sur la page
 */

import { useEffect, useCallback, useRef } from 'react';

export interface PageVisibilityOptions {
  /** Callback quand la page devient visible */
  onVisible?: () => void;
  /** Callback quand la page devient invisible */
  onHidden?: () => void;
  /** Délai avant de recharger après visibilité (ms) */
  reloadDelay?: number;
}

/**
 * Hook pour détecter les changements de visibilité de la page
 * Utilise la Page Visibility API pour détecter quand l'utilisateur
 * revient sur le tab/fenêtre
 */
export function usePageVisibility(options: PageVisibilityOptions = {}) {
  const {
    onVisible,
    onHidden,
    reloadDelay = 300, // Délai pour éviter les rechargements trop rapides
  } = options;

  const isVisibleRef = useRef(!document.hidden);

  const handleVisibilityChange = useCallback(() => {
    const isNowVisible = !document.hidden;
    const wasVisible = isVisibleRef.current;

    // Éviter les appels multiples
    if (isNowVisible === wasVisible) {
      return;
    }

    isVisibleRef.current = isNowVisible;

    if (isNowVisible) {
      // Page devient visible
      // Attendre un petit délai pour laisser le page focus se stabiliser
      setTimeout(() => {
        if (onVisible && isVisibleRef.current) {
          onVisible();
        }
      }, reloadDelay);
    } else {
      // Page devient invisible
      if (onHidden) {
        onHidden();
      }
    }
  }, [onVisible, onHidden, reloadDelay]);

  useEffect(() => {
    // Ajouter listener pour les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible: isVisibleRef.current,
  };
}
