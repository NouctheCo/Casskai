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
  requireOnboarding = true,
  requireCompany = true 
}) => {
  const { user, loading: authLoading, currentCompany, onboardingCompleted } = useAuth();
  const location = useLocation();

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
    console.warn('🔒 ProtectedRoute: Redirecting to auth - user not authenticated');
    // Sauvegarder l'URL demandée pour rediriger après la connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // FIX: Logique cohérente de vérification d'onboarding
  if (requireOnboarding && user) {
    // Debug logs seulement en mode développement avec debug activé
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.warn('📋 ProtectedRoute: Checking onboarding requirement', {
        requireOnboarding,
        onboardingCompleted,
        hasCurrentCompany: !!currentCompany,
        currentCompanyId: currentCompany?.id,
        currentPath: location.pathname
      });
    }

    // Si l'utilisateur est déjà sur la page d'onboarding, ne pas rediriger
    if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.warn('ℹ️ ProtectedRoute: Already on onboarding page - allowing render');
      }
      return <>{children}</>;
    }

    // Vérifier d'abord s'il y a une entreprise (locale ou remote)
    const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');
    
    // Si pas d'entreprise du tout, rediriger vers l'onboarding
    if (!currentCompany && !hasLocalCompany) {
      console.warn('🎯 ProtectedRoute: No company found - redirecting to onboarding');
      return <Navigate to="/onboarding" replace />;
    }

    // Si l'onboarding n'est pas complété selon l'état, mais qu'on a une entreprise,
    // vérifier la cohérence des données
    if (!onboardingCompleted && (currentCompany || hasLocalCompany)) {
      console.warn('⚠️ ProtectedRoute: Onboarding state inconsistent - company exists but onboarding not completed');
      // Dans ce cas, laisser passer - l'onboarding sera marqué comme complété par AuthContext
    } else if (!onboardingCompleted) {
      console.warn('🎯 ProtectedRoute: Onboarding not completed - redirecting to onboarding');
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Vérification séparée pour l'entreprise (nécessaire même si onboarding est complété)
  if (requireCompany && user) {
    const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');

    // Si pas d'entreprise dans Supabase et pas d'entreprise locale sauvegardée
    if (!currentCompany && !hasLocalCompany) {
      // Si on est déjà sur l'onboarding, permettre le rendu
      if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
        console.warn('ℹ️ ProtectedRoute: No company found but on onboarding page - allowing render');
        return <>{children}</>;
      }

      console.warn('🏢 ProtectedRoute: No company found - redirecting to onboarding');
      return <Navigate to="/onboarding" replace />;
    }

    // Si l'onboarding est complété mais que currentCompany n'est pas encore chargé,
    // afficher un état de chargement seulement si on n'est pas sur l'onboarding
    if (!currentCompany && hasLocalCompany && location.pathname !== '/onboarding') {
      console.warn('⏳ ProtectedRoute: Company data loading...');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
              Chargement des données de l'entreprise...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Si ce message persiste, veuillez rafraîchir la page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Si l'utilisateur est connecté et que les requirements sont satisfaits,
  // afficher le contenu protégé
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
    console.warn('🎉 ProtectedRoute: Access granted, rendering protected content');
  }
  return <>{children}</>;
};

export default ProtectedRoute;
