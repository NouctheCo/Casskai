/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
/**
 * Hook pour mémoriser et restaurer la position de scroll lors de la navigation
 * Améliore l'expérience utilisateur en évitant de perdre la position sur la page
 */
export function useScrollRestoration(): null {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const isRestoringScroll = useRef(false);
  useEffect(() => {
    // Sauvegarder la position de scroll actuelle avant de changer de page
    const handleBeforeUnload = () => {
      const scrollY = window.scrollY;
      scrollPositions.current.set(location.pathname, scrollY);
      sessionStorage.setItem('scrollPositions', JSON.stringify(Array.from(scrollPositions.current.entries())));
    };
    // Restaurer les positions de scroll depuis le sessionStorage au chargement
    const savedPositions = sessionStorage.getItem('scrollPositions');
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        scrollPositions.current = new Map(positions);
      } catch (error) {
        logger.error('UseScrollRestoration', 'Erreur lors de la restauration des positions de scroll:', error);
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);
  useEffect(() => {
    // Sauvegarder la position actuelle avant de naviguer
    const currentPath = location.pathname;
    const currentScroll = window.scrollY;
    return () => {
      scrollPositions.current.set(currentPath, currentScroll);
      sessionStorage.setItem('scrollPositions', JSON.stringify(Array.from(scrollPositions.current.entries())));
    };
  }, [location.pathname]);
  useEffect(() => {
    // Restaurer la position de scroll pour cette page
    if (isRestoringScroll.current) {
      return;
    }
    const savedPosition = scrollPositions.current.get(location.pathname);
    if (savedPosition !== undefined) {
      isRestoringScroll.current = true;
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est rendu
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant' as ScrollBehavior
        });
        // Réinitialiser le flag après un court délai
        setTimeout(() => {
          isRestoringScroll.current = false;
        }, 100);
      });
    } else {
      // Nouvelle page, scroller en haut
      window.scrollTo({
        top: 0,
        behavior: 'instant' as ScrollBehavior
      });
    }
  }, [location.pathname]);
  return null;
}