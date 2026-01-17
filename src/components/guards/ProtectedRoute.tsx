import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { logger } from '@/lib/logger';

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
  const { user, loading: authLoading, currentCompany, isCheckingOnboarding } = useAuth();
  const location = useLocation();
  const { isExpired, isLoading: subscriptionLoading } = useSubscriptionStatus();

  // In E2E mode, bypass auth/onboarding guards to allow smoke navigation
  if (import.meta.env.VITE_E2E_BYPASS_AUTH === 'true') {
    return <>{children}</>;
  }

  // Afficher le loader pendant que l'authentification, l'abonnement ou le check d'onboarding se charge
  if (authLoading || subscriptionLoading || isCheckingOnboarding) {
    return <LoadingFallback message="Vérification des autorisations..." />;
  }

  // Si l'utilisateur n'est pas connecté et que l'auth est requise, rediriger vers la page de connexion
  if (requireAuth && !user) {
    logger.warn('Router', 'Redirecting to auth - user not authenticated');
    // Sauvegarder l'URL demandée pour rediriger après la connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ✅ LOGIQUE SIMPLIFIÉE ET STRICTE : Si tu as une entreprise, tu passes. Sinon onboarding.
  if (requireOnboarding && user) {
    // Si l'utilisateur est déjà sur la page d'onboarding, laisser passer
    if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
      return <>{children}</>;
    }

    // ⚠️ RÈGLE SIMPLE : Si pas d'entreprise → onboarding. Si entreprise → OK.
    // On ne vérifie PAS onboardingCompleted car c'est source de bugs
    const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');

    if (!currentCompany && !hasLocalCompany) {
      logger.warn('Router', 'No company - redirecting to onboarding');
      return <Navigate to="/onboarding" replace />;
    }

    // Si on a une entreprise (locale ou remote), on laisse TOUJOURS passer
    // Plus de vérification d'onboardingCompleted qui causait les bugs
  }

  // Vérification séparée pour l'entreprise (nécessaire même si onboarding est complété)
  if (requireCompany && user) {
    const hasLocalCompany = localStorage.getItem('casskai_current_enterprise');

    // Si pas d'entreprise dans Supabase et pas d'entreprise locale sauvegardée
    if (!currentCompany && !hasLocalCompany) {
      // Si on est déjà sur l'onboarding, permettre le rendu
      if (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')) {
        logger.info('Router', 'No company found but on onboarding page - allowing render');
        return <>{children}</>;
      }

      logger.warn('Router', 'No company found - redirecting to onboarding');
      return <Navigate to="/onboarding" replace />;
    }

    // Si l'onboarding est complété mais que currentCompany n'est pas encore chargé,
    // afficher un état de chargement seulement si on n'est pas sur l'onboarding
    if (!currentCompany && hasLocalCompany && location.pathname !== '/onboarding') {
      logger.info('Router', 'Company data loading...');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
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

  // Vérification de l'abonnement : rediriger vers /billing si expiré
  // SAUF si l'utilisateur est déjà sur la page de billing
  const billingPaths = ['/billing', '/pricing'];
  const isOnBillingPage = billingPaths.some(path => location.pathname.startsWith(path));

  if (user && isExpired && !isOnBillingPage) {
    logger.warn('Router', 'Subscription expired - redirecting to billing');
    return <Navigate to="/billing" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté et que les requirements sont satisfaits,
  // afficher le contenu protégé
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
    logger.debug('Router', 'Access granted, rendering protected content');
  }
  return <>{children}</>;
};

export default ProtectedRoute;
