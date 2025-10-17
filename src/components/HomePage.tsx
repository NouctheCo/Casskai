import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';
import { readUserScopedItem, STORAGE_KEYS } from '@/utils/userStorage';
import { logger } from '@/utils/logger';

/**
 * Composant qui gère la redirection de la page d'accueil
 * selon l'état d'authentification de l'utilisateur
 */
export const HomePage: React.FC = () => {
  const { user, loading: authLoading, currentCompany, onboardingCompleted } = useAuth();

  // Afficher un loader pendant le chargement
  if (authLoading) {
    return <LoadingFallback message="Chargement..." />;
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la landing page
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  const hasLocalCompany = user ? readUserScopedItem(STORAGE_KEYS.CURRENT_ENTERPRISE, user.id) : null;

  console.log('🏠 HomePage Debug:', {
    userId: user?.id,
    onboardingCompleted,
    hasCurrentCompany: !!currentCompany,
    currentCompanyId: currentCompany?.id,
    hasLocalCompany: !!hasLocalCompany,
    userMetadata: user?.user_metadata
  });

  // Si l'utilisateur est connecté mais l'onboarding n'est pas complété
  // ET qu'il n'y a pas de company dans Supabase ET pas d'entreprise locale
  if (user && !onboardingCompleted && !currentCompany && !hasLocalCompany) {
    logger.info('🎯 HomePage: Redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  // Si l'onboarding est marqué comme complété mais que currentCompany n'est pas encore chargé,
  // afficher un état de chargement pour éviter la redirection prématurée vers le dashboard
  if (user && onboardingCompleted && !currentCompany && !hasLocalCompany) {
    logger.info('⏳ HomePage: Onboarding completed but waiting for company data');
    return <LoadingFallback message="Chargement des données de l'entreprise..." />;
  }

  // Si l'utilisateur a complété l'onboarding ET a une entreprise (locale ou Supabase), 
  // rediriger vers le dashboard
  if (user && onboardingCompleted && (currentCompany || hasLocalCompany)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Cas par défaut : rediriger vers le dashboard (pour les utilisateurs existants)
  return <Navigate to="/dashboard" replace />;
};

export default HomePage;
