import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireOnboarding = false,
  requireCompany = true 
}) => {
  const { user, loading: authLoading, currentCompany } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute: Route protection check', {
    pathname: location.pathname,
    requireAuth,
    requireOnboarding,
    requireCompany,
    hasUser: !!user,
    userId: user?.id,
    authLoading,
    hasCurrentCompany: !!currentCompany,
    currentCompanyId: currentCompany?.id,
    onboardingCompleted: user?.user_metadata?.onboarding_completed
  });

  // In E2E mode, bypass auth/onboarding guards to allow smoke navigation
  if (import.meta.env.VITE_E2E_BYPASS_AUTH === 'true') {
    return <>{children}</>;
  }

  // Afficher le loader pendant que l'authentification se charge
  if (authLoading) {
    return <LoadingFallback message="Vérification des autorisations..." />;
  }

  // Si l'utilisateur n'est pas connecté et que l'auth est requise, rediriger vers la page de connexion
  if (requireAuth && !user) {
    console.log('🔒 ProtectedRoute: Redirecting to auth - user not authenticated');
    // Sauvegarder l'URL demandée pour rediriger après la connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // FIX: Logique cohérente de vérification d'onboarding
  if ((requireOnboarding || requireCompany) && user) {
    const onboardingCompleted = user?.user_metadata?.onboarding_completed || 
                               localStorage.getItem('casskai_onboarding_completed') === 'true';
    const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');
    
    console.log('📋 ProtectedRoute: Checking onboarding/company requirements', {
      requireOnboarding,
      requireCompany,
      onboardingCompleted,
      hasCurrentCompany: !!currentCompany,
      currentCompanyId: currentCompany?.id,
      hasLocalCompany: !!hasLocalCompany,
      localCompanyId: hasLocalCompany
    });
    
    // Rediriger vers onboarding seulement si :
    // - L'onboarding n'est PAS complété dans les user_metadata ET
    // - Pas de currentCompany dans Supabase ET  
    // - Pas d'entreprise locale sauvegardée
    if (!onboardingCompleted && !currentCompany && !hasLocalCompany) {
      console.log('🎯 ProtectedRoute: Redirecting to onboarding - requirements not met');
      return <Navigate to="/onboarding" replace />;
    }

    console.log('✅ ProtectedRoute: Onboarding/company requirements satisfied');
  }

  // Si l'utilisateur est connecté et que les requirements sont satisfaits,
  // afficher le contenu protégé
  console.log('🎉 ProtectedRoute: Access granted, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
