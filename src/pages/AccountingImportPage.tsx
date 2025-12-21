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

import { AccountingImportExport } from '../components/accounting/AccountingImportExport';

import { useConfig } from '../hooks/useConfig';

import { useTranslation } from 'react-i18next';

import { toastSuccess, toastError } from '@/lib/toast-helpers';

import { PageContainer } from '../components/ui/PageContainer';



const AccountingImportPage: React.FC = () => {

  const { t } = useTranslation();

  const { config } = useConfig();

  

  const companyId = (config as any)?.currentCompany?.id;



  if (!companyId) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="text-center">

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">

            {t('common.noCompanySelected')}

          </h2>

          <p className="text-gray-600 dark:text-gray-400">

            Veuillez sélectionner une entreprise pour accéder aux fonctionnalités d'import.

          </p>

        </div>

      </div>

    );

  }



  const handleImportComplete = (result: any) => {

    toastSuccess(`${result.validRows} écritures importées avec succès`);

  };



  const handleError = (error: string) => {

    toastError(error);

  };



  return (

    <PageContainer variant="default">

      <AccountingImportExport

        companyId={companyId}

        onImportComplete={handleImportComplete}

        onError={handleError}

      />

    </PageContainer>

  );

};



export default AccountingImportPage;
