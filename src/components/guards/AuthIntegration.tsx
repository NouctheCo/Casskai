// src/components/guards/AuthIntegration.tsx



import React, { useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';



/**

 * Composant pour synchroniser notre système d'auth Supabase 

 * avec votre AuthProvider existant

 */

interface AuthIntegrationProps {

  children: React.ReactNode;

  onAuthStateChange?: (isAuthenticated: boolean, user: any) => void;

}



export const AuthIntegration: React.FC<AuthIntegrationProps> = ({ 

  children, 

  onAuthStateChange 

}) => {

  const { user, session: _session } = useAuth();

  const isAuthenticated = !!user;



  // Synchroniser avec votre AuthProvider

  useEffect(() => {

    if (onAuthStateChange) {

      onAuthStateChange(isAuthenticated, user);

    }

  }, [isAuthenticated, user, onAuthStateChange]);



  // Vous pouvez ajouter ici d'autres synchronisations

  // par exemple avec votre contexte d'entreprise existant



  return <>{children}</>;

};



// Version simplifiée de AuthGuard qui s'appuie sur votre AuthProvider

export const SimpleAuthGuard: React.FC<{

  children: React.ReactNode;

  requireAuth?: boolean;

  fallback?: React.ReactNode;

}> = ({ 

  children, 

  requireAuth = true, 

  fallback 

}) => {

  const { user } = useAuth();

  const isAuthenticated = !!user;

  const isLoading = false; // Auth state is synchronous from context



  // Si l'auth n'est pas requise, afficher le contenu

  if (!requireAuth) {

    return <>{children}</>;

  }



  // Si en cours de chargement

  if (isLoading) {

    return (

      <div className="flex h-screen w-screen items-center justify-center">

        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>

      </div>

    );

  }



  // Si pas authentifié, rediriger ou afficher fallback

  if (!isAuthenticated) {

    if (fallback) {

      return <>{fallback}</>;

    }

    

    // Rediriger vers votre page d'auth existante

    window.location.href = '/auth';

    return null;

  }



  // Authentifié, afficher le contenu

  return <>{children}</>;

};
