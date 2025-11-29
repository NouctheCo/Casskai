/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// Dashboard Page pour CassKai - Version Enterprise
import React from 'react';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { EnterpriseDashboard } from '@/components/dashboard/EnterpriseDashboard';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Building } from 'lucide-react';

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
        <EnterpriseDashboard />
      </DashboardErrorBoundary>
    </>
  );
};

export default DashboardPage;
