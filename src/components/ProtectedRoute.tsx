import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfigContext } from '../contexts/ConfigContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetupComplete?: boolean; // true = dashboard, false = setup
}

const ProtectedRoute = ({ children, requireSetupComplete = true }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { config, isConfigured, isLoading: configLoading } = useConfigContext();
  const location = useLocation();
  
  // Log pour faciliter le débogage
  useEffect(() => {
    console.log('ProtectedRoute état:', { 
      authLoading, 
      configLoading, 
      user: !!user, 
      isConfigured,
      requireSetupComplete,
      path: location.pathname
    });
  }, [authLoading, configLoading, user, isConfigured, requireSetupComplete, location.pathname]);

  // Chargement global - attendre que auth et config soient prêts
  const isLoading = authLoading || configLoading;
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Pas authentifié → login
  if (!user) {
    console.log('Redirection vers login car non authentifié');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Setup incomplet → redirige dashboard vers /setup, ou l'inverse
  const setupComplete = config?.setupCompleted || isConfigured;
  
  if (requireSetupComplete && !setupComplete) {
    console.log('Redirection vers setup car configuration incomplète');
    return <Navigate to="/setup" replace />;
  }
  
  if (!requireSetupComplete && setupComplete) {
    console.log('Redirection vers dashboard car configuration déjà complète');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
