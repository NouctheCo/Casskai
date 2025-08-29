import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

/**
 * Composant qui gère la redirection de la page d'accueil
 * selon l'état d'authentification de l'utilisateur
 */
export const HomePage: React.FC = () => {
  const { user, loading: authLoading, currentCompany } = useAuth();

  // Afficher un loader pendant le chargement
  if (authLoading) {
    return <LoadingFallback message="Chargement..." />;
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la landing page
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // FIX: Vérifier si l'onboarding est complété via user_metadata OU localStorage
  const onboardingCompleted = user?.user_metadata?.onboarding_completed || 
                             localStorage.getItem('casskai_onboarding_completed') === 'true';
  const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');

  // Si l'utilisateur est connecté mais l'onboarding n'est pas complété
  // ET qu'il n'y a pas de company dans Supabase ET pas d'entreprise locale
  if (user && !onboardingCompleted && !currentCompany && !hasLocalCompany) {
    return <Navigate to="/onboarding" replace />;
  }

  // Si l'utilisateur a complété l'onboarding OU a une entreprise (locale ou Supabase), 
  // rediriger vers le dashboard
  return <Navigate to="/dashboard" replace />;
};

export default HomePage;