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

import React from 'react';
import { ReportsManagementTabs } from '../components/reports/ReportsManagementTabs';
import { useAuth } from '../contexts/AuthContext';

const ReportsPage: React.FC = () => {
  const { currentCompany } = useAuth();

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 dark:text-gray-400">Veuillez sélectionner une entreprise</p>
      </div>
    );
  }

  return <ReportsManagementTabs companyId={currentCompany.id} />;
};

export default ReportsPage;
