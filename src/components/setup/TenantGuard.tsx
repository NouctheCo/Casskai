// components/TenantGuard.tsx
import React from 'react';

// Stub hook - useTenant not available
const useTenant = () => ({ isReady: true, tenant: null, error: null, isLoading: false, currentTenant: null });

interface TenantGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TenantGuard({ children, fallback }: TenantGuardProps) {
  const { isLoading, error, currentTenant } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Initialisation de votre environnement...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTenant) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur de Configuration</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error || 'Tenant non configuré'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
