// Dashboard Page pour CassKai - Version Enterprise
import React, { Suspense } from 'react';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Building, Loader2 } from 'lucide-react';

// Lazy load the heavy dashboard component
const EnterpriseDashboard = React.lazy(() => import('@/components/dashboard/EnterpriseDashboard').then(module => ({ default: module.EnterpriseDashboard })));

// Loading component for dashboard
const DashboardLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <p className="text-lg text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { currentEnterprise } = useEnterprise();

  // Si pas d'entreprise sélectionnée, afficher un message
  if (!currentEnterprise) {
    return (
      <div className="flex items-center justify-center min-h-96 p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Building className="h-20 w-20 text-blue-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Aucune entreprise configurée
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Pour accéder au dashboard, vous devez d'abord créer votre entreprise via le processus d'onboarding.
          </p>
          <button
            onClick={() => window.location.href = '/onboarding'}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Building className="h-5 w-5 mr-2" />
            Créer mon entreprise
          </button>
          <p className="text-xs text-gray-500 mt-4">
            L'onboarding vous guidera dans la configuration de votre première entreprise
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardErrorBoundary>
        <Suspense fallback={<DashboardLoader />}>
          <EnterpriseDashboard />
        </Suspense>
      </DashboardErrorBoundary>
    </>
  );
};

export default DashboardPage;