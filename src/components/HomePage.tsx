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

  // Si l'utilisateur est connecté mais n'a pas d'entreprise configurée dans Supabase, 
  // rediriger vers l'onboarding
  if (user && !currentCompany) {
    return <Navigate to="/onboarding" replace />;
  }

  // Si l'utilisateur est connecté et a une entreprise, rediriger vers le dashboard
  return <Navigate to="/dashboard" replace />;
};

export default HomePage;