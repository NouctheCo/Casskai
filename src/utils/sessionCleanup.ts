import { logger } from '@/utils/logger';
// Utilitaire pour nettoyer les sessions problématiques
// À utiliser en cas de problèmes d'onboarding/auth

export const clearUserSession = () => {
  try {
    // Nettoyer localStorage
    const keysToRemove = [
      'supabase.auth.token',
      'sb-smtdtgrymuzwvctattmx-auth-token',
      'casskai-onboarding-state',
      'casskai-user-context',
      'casskai-company-context',
      'user-preferences',
      'onboarding-progress'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      // Aussi en sessionStorage au cas où
      sessionStorage.removeItem(key);
    });

    // Nettoyer les cookies Supabase
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('supabase') || name.includes('casskai') || name.includes('auth')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.casskai.app`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    logger.info('✅ Session nettoyée avec succès');

    // Recharger la page pour une session propre
    window.location.href = '/';

  } catch (error) {
    logger.error('Erreur lors du nettoyage de session:', error)
  }
};

// Fonction à appeler en cas d'erreur d'onboarding persistante
export const resetOnboardingState = () => {
  clearUserSession();
  // Ajouter un flag pour forcer le redémarrage
  localStorage.setItem('force-fresh-start', 'true');
};