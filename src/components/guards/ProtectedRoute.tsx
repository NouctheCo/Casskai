import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireCompany = true 
}) => {
  const { user, loading: authLoading, currentCompany } = useAuth();
  const location = useLocation();

  // Afficher le loader pendant que l'authentification se charge
  if (authLoading) {
    return <LoadingFallback message="Vérification des autorisations..." />;
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    // Sauvegarder l'URL demandée pour rediriger après la connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requireCompany est true et qu'aucune entreprise n'est configurée dans Supabase,
  // rediriger vers l'onboarding
  if (requireCompany && !currentCompany) {
    return <Navigate to="/onboarding" replace />;
  }

  // Si l'utilisateur est connecté et que les requirements sont satisfaits,
  // afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
